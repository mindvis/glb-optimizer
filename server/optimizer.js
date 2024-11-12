// server/optimizer.js
const { Document, NodeIO } = require('@gltf-transform/core');
const { dedup, draco, resample, prune } = require('@gltf-transform/functions');
const { KHRONOS_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3d');
const sharp = require('sharp');
const fs = require('fs');

async function optimizeGLB(inputPath, settings) {
    try {
        // Get original file size at the beginning
        const originalFileSize = fs.statSync(inputPath).size / (1024 * 1024);
        console.log('Starting optimization with settings:', settings);
        console.log(`Original file size: ${originalFileSize.toFixed(2)} MB`);
        
        // Validate settings
        const validatedSettings = {
            targetSize: Number(settings.targetSize),
            textureFormat: String(settings.textureFormat).toLowerCase(),
            maxTextureSize: Number(settings.maxTextureSize),
            textureQuality: Number(settings.textureQuality),
            targetTriangles: Number(settings.targetTriangles),
            preserveNormals: Boolean(settings.preserveNormals)
        };

        console.log('Validated optimization settings:', validatedSettings);

        // Initialize IO
        const io = new NodeIO()
            .registerExtensions(KHRONOS_EXTENSIONS)
            .registerDependencies({
                'draco3d.decoder': await draco3d.createDecoderModule(),
                'draco3d.encoder': await draco3d.createEncoderModule(),
            });

        // Load document
        let document = await io.read(inputPath);

        // Get initial triangle count
        let initialTriangles = 0;
        document.getRoot().listMeshes().forEach(mesh => {
            mesh.listPrimitives().forEach(primitive => {
                const indices = primitive.getIndices();
                if (indices) {
                    initialTriangles += indices.getCount() / 3;
                }
            });
        });

        // Process textures
        console.log('Processing textures...');
        const textures = document.getRoot().listTextures();
        for (const texture of textures) {
            const image = texture.getImage();
            if (!image) continue;

            try {
                const imageBuffer = Buffer.from(image);
                const isNormalMap = texture.getName()?.toLowerCase().includes('normal') ||
                                  texture.getURI()?.toLowerCase().includes('normal');

                const processedImage = sharp(imageBuffer).resize(
                    isNormalMap && validatedSettings.preserveNormals ? 
                        Math.max(validatedSettings.maxTextureSize, 1024) : 
                        validatedSettings.maxTextureSize,
                    isNormalMap && validatedSettings.preserveNormals ? 
                        Math.max(validatedSettings.maxTextureSize, 1024) : 
                        validatedSettings.maxTextureSize,
                    { fit: 'inside', withoutEnlargement: true }
                );

                let outputBuffer;
                switch (validatedSettings.textureFormat) {
                    case 'png':
                        outputBuffer = await processedImage.png({
                            quality: validatedSettings.textureQuality,
                            compressionLevel: 9,
                        }).toBuffer();
                        texture.setMimeType('image/png');
                        break;
                        
                    case 'jpeg':
                        outputBuffer = await processedImage.jpeg({
                            quality: validatedSettings.textureQuality,
                            chromaSubsampling: isNormalMap ? '4:4:4' : '4:2:0'
                        }).toBuffer();
                        texture.setMimeType('image/jpeg');
                        break;
                        
                    case 'webp':
                    default:
                        outputBuffer = await processedImage.webp({
                            quality: validatedSettings.textureQuality,
                            effort: 6,
                            lossless: isNormalMap && validatedSettings.preserveNormals
                        }).toBuffer();
                        texture.setMimeType('image/webp');
                        break;
                }

                texture.setImage(new Uint8Array(outputBuffer));
            } catch (err) {
                console.warn('Failed to process texture:', err.message);
            }
        }

        // Calculate geometry reduction
        const geometryRatio = Math.min(1, validatedSettings.targetTriangles / Math.max(initialTriangles, 1));
        console.log(`Geometry reduction ratio: ${geometryRatio.toFixed(3)}`);

        // Optimize geometry
        console.log('Optimizing geometry...');
        await document.transform(
            dedup({
                keepMaterials: true,
                keepTextures: true
            }),
            
            resample({
                ratio: geometryRatio,
                error: 0.001,
                meshoptSimplifier: true
            }),
            
            draco({
                method: 'edgebreaker',
                quantizePosition: validatedSettings.preserveNormals ? 14 : 12,
                quantizeNormal: validatedSettings.preserveNormals ? 12 : 8,
                quantizeTexcoord: 12,
                quantizeColor: 8,
                quantizeGeneric: 8,
                compressionLevel: 7
            })
        );

        // Save optimized model
        const outputPath = inputPath.replace('.glb', '_optimized.glb');
        await io.write(outputPath, document);

        // Get final statistics
        const finalFileSize = fs.statSync(outputPath).size / (1024 * 1024);
        let finalTriangles = 0;
        
        document.getRoot().listMeshes().forEach(mesh => {
            mesh.listPrimitives().forEach(primitive => {
                const indices = primitive.getIndices();
                if (indices) {
                    finalTriangles += indices.getCount() / 3;
                }
            });
        });

        const stats = {
            originalSize: originalFileSize,
            optimizedSize: finalFileSize,
            reduction: ((1 - finalFileSize / originalFileSize) * 100).toFixed(1),
            originalTriangles: initialTriangles,
            finalTriangles: finalTriangles,
            triangleReduction: ((1 - finalTriangles / initialTriangles) * 100).toFixed(1)
        };

        console.log('Optimization complete:', stats);
        return { path: outputPath, stats };

    } catch (error) {
        console.error('Optimization error:', error);
        throw error;
    }
}

module.exports = { optimizeGLB };