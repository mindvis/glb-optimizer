// components/OptionsPanel.jsx
import { useState, useEffect } from 'react';

function OptionsPanel({ options, onChange, disabled }) {
  const textureFormats = ['webp', 'png', 'jpeg'];
  const textureSizes = [256, 512, 1024, 2048, 4096];

  // Normalize the quality value to percentage (0-100)
  const qualityToPercentage = (value) => Math.round((value - 20) * (100 / 80));
  const percentageToQuality = (percent) => Math.round(20 + (percent * 80 / 100));

  const handleQualityChange = (event) => {
    const qualityValue = percentageToQuality(event.target.value);
    onChange({ ...options, quality: qualityValue });
  };

  return (
    <div className="space-y-4">
      {/* Quality Preset */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quality Preset
        </label>
        <select
          value={options.preset || 'custom'}
          onChange={(e) => onChange({ ...options, preset: e.target.value })}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="low">Low (Smaller file size)</option>
          <option value="medium">Medium (Balanced)</option>
          <option value="high">High (Better quality)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Target File Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target File Size (MB): {options.targetSize || 10}
        </label>
        <input
          type="range"
          min="1"
          max="25"
          value={options.targetSize || 10}
          onChange={(e) => onChange({ ...options, targetSize: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1MB</span>
          <span>25MB</span>
        </div>
      </div>

      {/* Texture Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texture Format
        </label>
        <select
          value={options.textureFormat || 'webp'}
          onChange={(e) => onChange({ ...options, textureFormat: e.target.value })}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {textureFormats.map(format => (
            <option key={format} value={format}>
              {format.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Max Texture Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Texture Size
        </label>
        <select
          value={options.maxTextureSize || 2048}
          onChange={(e) => onChange({ ...options, maxTextureSize: parseInt(e.target.value) })}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {textureSizes.map(size => (
            <option key={size} value={size}>
              {size}x{size}
            </option>
          ))}
        </select>
      </div>

      {/* Texture Quality */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texture Quality: {options.quality || 75}%
        </label>
        <input
          type="range"
          min="20"
          max="100"
          value={options.quality || 75}
          onChange={(e) => onChange({ ...options, quality: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Target Triangles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Triangles: {(options.targetTriangles || 100000).toLocaleString()}
        </label>
        <input
          type="range"
          min="5000"
          max="100000"
          step="5000"
          value={options.targetTriangles || 100000}
          onChange={(e) => onChange({ ...options, targetTriangles: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>5K</span>
          <span>100K</span>
        </div>
      </div>

      {/* Preserve Normal Maps */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="preserveNormals"
          checked={options.preserveNormals !== false}
          onChange={(e) => onChange({ ...options, preserveNormals: e.target.checked })}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="preserveNormals" className="ml-2 block text-sm text-gray-700">
          Preserve Normal Maps
        </label>
      </div>
    </div>
  );
}

export default OptionsPanel;