// src/components/Uploader.jsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

export default function Uploader({ onFileSelect, currentFile }) {
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'model/gltf-binary': ['.glb'] },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto mb-4 text-gray-400" size={48} />
      
      {currentFile ? (
        <p className="text-sm text-gray-600">
          Selected: {currentFile.name}
        </p>
      ) : (
        <p className="text-gray-600">
          {isDragActive ? 
            'Drop the GLB file here...' : 
            'Drag & drop a GLB file here, or click to select'}
        </p>
      )}
    </div>
  );
}