// src/components/CompressionSettings.jsx
import React from 'react';

const CompressionSettings = ({ settings, onChange, disabled }) => {
  const handleChange = (field, value) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  const handleDracoChange = (field, value) => {
    onChange({
      ...settings,
      draco: {
        ...settings.draco,
        [field]: value
      }
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Compression Settings</h3>
      
      <div className="space-y-4">
        {/* Quality Preset */}
        <div>
          <label className="block text-sm font-medium mb-1">Quality Preset</label>
          <select
            value={settings.quality}
            onChange={(e) => handleChange('quality', e.target.value)}
            className="w-full p-2 border rounded"
            disabled={disabled}
          >
            <option value="low">Low (Fastest)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="high">High (Best Quality)</option>
          </select>
        </div>

        {/* Target Triangle Count */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Target Triangle Count: {settings.targetTriangles.toLocaleString()}
          </label>
          <input
            type="range"
            min="1000"
            max="500000"
            step="1000"
            value={settings.targetTriangles}
            onChange={(e) => handleChange('targetTriangles', parseInt(e.target.value))}
            className="w-full"
            disabled={disabled}
          />
        </div>

        {/* Texture Size */}
        <div>
          <label className="block text-sm font-medium mb-1">Max Texture Size</label>
          <select
            value={settings.maxTextureSize}
            onChange={(e) => handleChange('maxTextureSize', parseInt(e.target.value))}
            className="w-full p-2 border rounded"
            disabled={disabled}
          >
            <option value="1024">1024px</option>
            <option value="2048">2048px</option>
            <option value="4096">4096px</option>
          </select>
        </div>

        {/* Advanced Draco Settings */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-2">Advanced Draco Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">
                Position Quantization: {settings.draco.quantizePosition}
              </label>
              <input
                type="range"
                min="8"
                max="16"
                value={settings.draco.quantizePosition}
                onChange={(e) => handleDracoChange('quantizePosition', parseInt(e.target.value))}
                className="w-full"
                disabled={disabled}
              />
              <div className="text-xs text-gray-500">
                Higher values = better quality, larger file size
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">
                Normal Quantization: {settings.draco.quantizeNormal}
              </label>
              <input
                type="range"
                min="6"
                max="12"
                value={settings.draco.quantizeNormal}
                onChange={(e) => handleDracoChange('quantizeNormal', parseInt(e.target.value))}
                className="w-full"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                UV Quantization: {settings.draco.quantizeTexcoord}
              </label>
              <input
                type="range"
                min="8"
                max="14"
                value={settings.draco.quantizeTexcoord}
                onChange={(e) => handleDracoChange('quantizeTexcoord', parseInt(e.target.value))}
                className="w-full"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                Compression Level: {settings.draco.compressionLevel}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.draco.compressionLevel}
                onChange={(e) => handleDracoChange('compressionLevel', parseInt(e.target.value))}
                className="w-full"
                disabled={disabled}
              />
              <div className="text-xs text-gray-500">
                Higher values = better compression, slower processing
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionSettings;