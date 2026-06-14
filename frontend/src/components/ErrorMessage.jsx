export default function ErrorMessage({ message, onRetry, title = 'request_failed' }) {
  return (
    <div className="card border-red-900/50 p-8 text-center">
      <div className="eyebrow text-red-400 mb-2">{title}</div>
      <div className="text-red-300 text-sm mb-4 font-mono">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-mono text-red-300 border border-red-900
                     px-4 py-2 hover:bg-red-950/50 transition-colors"
        >
          retry()
        </button>
      )}
    </div>
  )
}