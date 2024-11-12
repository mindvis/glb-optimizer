export default function StatusBar({ status, progress }) {
    if (!status) return null;
  
    return (
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-center text-gray-600">{status}</p>
      </div>
    );
  }