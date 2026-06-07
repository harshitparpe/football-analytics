export default function ErrorMessage({ message, onRetry, title = 'Failed to load' }) {
  return (
    <div className="bg-gray-900 border border-red-900/50 rounded-xl p-8 text-center">
      <div className="text-3xl mb-3">⚠️</div>
      <div className="text-white font-semibold mb-1">{title}</div>
      <div className="text-red-400 text-sm mb-4">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-white bg-red-900/50 border border-red-800
                     rounded-lg px-4 py-2 hover:bg-red-900 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}