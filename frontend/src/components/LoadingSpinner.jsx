export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent
                        rounded-full animate-spin mx-auto mb-3" />
        <div className="text-gray-500 text-sm">{text}</div>
      </div>
    </div>
  )
}