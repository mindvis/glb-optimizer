// src/components/AdvancedSettings.jsx
const AdvancedSettings = ({ settings, onChange, disabled }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target File Size (MB)
                </label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.targetSize}
                    onChange={(e) => onChange({
                        ...settings,
                        targetSize: Number(e.target.value)
                    })}
                    className="w-full p-2 border rounded"
                    disabled={disabled}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Triangle Count
                </label>
                <input
                    type="range"
                    min="10000"
                    max="200000"
                    step="10000"
                    value={settings.targetTriangles}
                    onChange={(e) => onChange({
                        ...settings,
                        targetTriangles: Number(e.target.value)
                    })}
                    className="w-full"
                    disabled={disabled}
                />
                <div className="text-sm text-gray-500">{settings.targetTriangles.toLocaleString()} triangles</div>
            </div>

            {/* Add more advanced settings as needed */}
        </div>
    );
};

export default AdvancedSettings;