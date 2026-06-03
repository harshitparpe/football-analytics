export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-950 border border-red-800 rounded-xl p-6 text-center">
      <div className="text-red-400 text-sm mb-3">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-400 border border-red-700 rounded-lg
                     px-4 py-1.5 hover:bg-red-900 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}