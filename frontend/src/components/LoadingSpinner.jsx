export default function LoadingSpinner({ text = 'loading...' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-6 h-6 border border-accent border-t-transparent
                        animate-spin mx-auto mb-3" />
        <div className="eyebrow">{text}</div>
      </div>
    </div>
  )
}