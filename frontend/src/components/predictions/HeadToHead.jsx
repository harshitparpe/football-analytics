export default function HeadToHead({ h2h }) {
  if (!h2h || h2h.played === 0) {
    return (
      <div className="text-center py-6 text-gray-600 text-sm">
        No previous meetings found
      </div>
    )
  }

  const total   = h2h.played
  const aWidth  = total ? ((h2h.team_a_wins / total) * 100).toFixed(0) : 0
  const dWidth  = total ? ((h2h.draws        / total) * 100).toFixed(0) : 0
  const bWidth  = total ? ((h2h.team_b_wins  / total) * 100).toFixed(0) : 0

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span className="font-medium text-blue-400">
            {h2h.team_a} ({h2h.team_a_wins}W)
          </span>
          <span className="text-gray-500">
            {h2h.draws}D
          </span>
          <span className="font-medium text-amber-400">
            {h2h.team_b} ({h2h.team_b_wins}W)
          </span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${aWidth}%` }}
          />
          <div
            className="bg-gray-600 transition-all"
            style={{ width: `${dWidth}%` }}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${bWidth}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-1.5">
          {total} meetings
        </div>
      </div>

      {/* Recent matches */}
      {h2h.matches?.length > 0 && (
        <div>
          <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider">
            Recent meetings
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {h2h.matches.map((m, i) => (
              <div key={i}
                className="flex items-center justify-between bg-gray-800/50
                           rounded-lg px-3 py-2 text-xs"
              >
                <span className="text-gray-500 w-10">{m.year}</span>
                <span className="text-gray-400 text-center flex-1">{m.stage}</span>
                <span className={`font-bold text-center w-12
                  ${m.score === '—' ? 'text-gray-600' : 'text-white'}`}>
                  {m.score}
                </span>
                <span className={`text-right flex-1 font-medium
                  ${m.winner === h2h.team_a ? 'text-blue-400' :
                    m.winner === h2h.team_b ? 'text-amber-400' :
                    'text-gray-500'}`}>
                  {m.winner}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}