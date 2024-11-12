// server/index.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { optimizeGLB } = require('./optimizer');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'model/gltf-binary' && !file.originalname.toLowerCase().endsWith('.glb')) {
            cb(new Error('Only GLB files are allowed'), false);
            return;
        }
        cb(null, true);
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Main optimization endpoint
// server/index.js
app.post('/api/optimize', upload.single('model'), async (req, res) => {
    let originalPath = null;
    let optimizedPath = null;

    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        originalPath = req.file.path;

        // Parse and validate settings
        let settings;
        try {
            settings = JSON.parse(req.body.settings);
            console.log('Received settings:', settings);
        } catch (error) {
            console.error('Error parsing settings:', error);
            throw new Error('Invalid settings provided');
        }

        // Validate required settings
        const validatedSettings = {
            targetSize: Number(settings.targetSize) || 25,
            textureFormat: settings.textureFormat || 'png',
            maxTextureSize: Number(settings.maxTextureSize) || 2048,
            textureQuality: Number(settings.textureQuality) || 75,
            targetTriangles: Number(settings.targetTriangles) || 100000,
            preserveNormals: settings.preserveNormals !== false
        };

        console.log('Validated settings:', validatedSettings);

        // Call optimizer with validated settings
        const result = await optimizeGLB(originalPath, validatedSettings);

        // Set response headers
        res.set({
            'Content-Type': 'model/gltf-binary',
            'Content-Disposition': `attachment; filename="optimized_${req.file.originalname}"`,
            'X-Original-Size': result.stats.originalSize,
            'X-Optimized-Size': result.stats.optimizedSize,
            'X-Size-Reduction': result.stats.reduction,
            'Cache-Control': 'no-store'
        });

        // Send optimized file
        res.sendFile(result.path, (err) => {
            // Cleanup after sending
            if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
            if (fs.existsSync(result.path)) fs.unlinkSync(result.path);
            
            if (err) console.error('Error sending file:', err);
        });

    } catch (error) {
        // Cleanup on error
        if (originalPath && fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
        if (optimizedPath && fs.existsSync(optimizedPath)) fs.unlinkSync(optimizedPath);

        res.status(500).json({
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File is too large. Maximum size is 100MB'
            });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// Cleanup function
function cleanup(filepath) {
    if (filepath && fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) console.error('Cleanup error:', err);
        });
    }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Clean uploads directory on startup
fs.readdir(uploadsDir, (err, files) => {
    if (err) throw err;
    
    for (const file of files) {
        fs.unlink(path.join(uploadsDir, file), err => {
            if (err) console.error('Error deleting file:', err);
        });
    }
});

