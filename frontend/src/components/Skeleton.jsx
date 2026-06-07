export function SkeletonBox({ className = '' }) {
  return (
    <div className={`bg-gray-800 animate-pulse rounded-lg ${className}`} />
  )
}

export function SkeletonText({ width = 'w-full', className = '' }) {
  return (
    <div className={`bg-gray-800 animate-pulse rounded h-3.5 ${width} ${className}`} />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5
                     space-y-3 ${className}`}>
      <SkeletonBox className="h-6 w-24" />
      <SkeletonText width="w-3/4" />
      <SkeletonText width="w-1/2" />
    </div>
  )
}

// Matches the 4-stat-card row on Dashboard
export function StatCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <SkeletonBox className="h-7 w-7 mb-3" />
      <SkeletonBox className="h-8 w-20 mb-2" />
      <SkeletonText width="w-28" />
    </div>
  )
}

// Matches a table row
export function TableRowSkeleton({ cols = 4 }) {
  return (
    <tr className="border-b border-gray-800/40">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="bg-gray-800 animate-pulse rounded h-3.5 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Matches a player row in TopScorers
export function ScorerRowSkeleton() {
  return (
    <div className="px-5 py-3 border-b border-gray-800/50">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <SkeletonBox className="w-5 h-4" />
          <div className="space-y-1.5">
            <SkeletonBox className="h-3.5 w-28" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBox className="h-4 w-12" />
      </div>
      <div className="ml-7 bg-gray-800 rounded-full h-1.5" />
    </div>
  )
}