import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Settings, FileDown, AlertCircle } from 'lucide-react';
import Uploader from './components/Uploader';
import OptionsPanel from './components/OptionsPanel';
import StatusBar from './components/StatusBar';
import ModelPreview from './components/ModelPreview';

function App() {
  const [file, setFile] = useState(null);
  const [optimizedFile, setOptimizedFile] = useState(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const abortControllerRef = useRef(null);
  
  // Initialize with explicit default values
  const [options, setOptions] = useState({
    targetSize: 25,
    textureFormat: 'png',
    maxTextureSize: 2048,
    quality: 75,
    targetTriangles: 100000,
    preserveNormals: true,
    preset: 'custom'
  });

  // Handle options changes
  const handleOptionsChange = useCallback((newOptions) => {
    console.log('Options updated:', newOptions);
    setOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  }, []);

  // Handle optimization
  const handleOptimize = useCallback(async () => {
    if (!file) return;

    try {
      setError('');
      setStatus('Optimizing...');
      setProgress(10);
      setOptimizedFile(null);
      setStats(null);

      // Create FormData with current options
      const formData = new FormData();
      formData.append('model', file);
      
      // Log current options before sending
      console.log('Current options being sent:', options);
      
      const optimizationSettings = {
        targetSize: Number(options.targetSize),
        textureFormat: options.textureFormat,
        maxTextureSize: Number(options.maxTextureSize),
        textureQuality: Number(options.quality),
        targetTriangles: Number(options.targetTriangles),
        preserveNormals: options.preserveNormals
      };

      console.log('Sending optimization settings:', optimizationSettings);
      formData.append('settings', JSON.stringify(optimizationSettings));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/optimize`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Optimization failed');
      }

      setProgress(90);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const stats = {
        originalSize: parseFloat(response.headers.get('X-Original-Size')),
        optimizedSize: parseFloat(response.headers.get('X-Optimized-Size')),
        reduction: parseFloat(response.headers.get('X-Size-Reduction'))
      };
      
      setOptimizedFile(url);
      setStats(stats);
      setStatus('Optimization complete!');
      setProgress(100);
    } catch (err) {
      setError(err.message);
      setStatus('Failed');
      setProgress(0);
    }
  }, [file, options]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDownload = () => {
    if (optimizedFile) {
      const a = document.createElement('a');
      a.href = optimizedFile;
      a.download = file.name.replace('.glb', '_optimized.glb');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">GLB Optimizer</h1>
          <p className="text-gray-600">
            Optimize your 3D models for web and AR applications
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Upload className="mr-2" size={20} />
                Upload Model
              </h2>
              <Uploader 
                onFileSelect={setFile} 
                currentFile={file}
              />
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Settings className="mr-2" size={20} />
                Optimization Settings
              </h2>
              <OptionsPanel 
                options={options} 
                onChange={setOptions}
                disabled={status === 'Optimizing...'}
              />
            </div>

            <StatusBar 
              status={status} 
              progress={progress}
              stats={stats}
            />

            <div className="flex gap-3">
              <button
                onClick={handleOptimize}
                disabled={!file || status === 'Optimizing...'}
                className={`flex-1 py-2 px-4 rounded-md text-white font-medium
                  ${!file || status === 'Optimizing...' 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {status === 'Optimizing...' ? 'Processing...' : 'Optimize Model'}
              </button>

              {status === 'Optimizing...' && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-red-600 font-medium border border-red-200 
                    rounded-md hover:bg-red-50"
                >
                  Cancel
                </button>
              )}

              {optimizedFile && (
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-green-600 font-medium border border-green-200 
                    rounded-md hover:bg-green-50 flex items-center"
                >
                  <FileDown className="mr-2" size={20} />
                  Download
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Model Preview</h2>
            <div className="aspect-square">
              <ModelPreview 
                file={file} 
                optimizedFile={optimizedFile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;