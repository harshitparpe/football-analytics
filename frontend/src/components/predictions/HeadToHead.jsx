export default function HeadToHead({ h2h }) {
  if (!h2h || h2h.played === 0) {
    return (
      <div className="text-center py-6 text-muted text-sm">
        No previous meetings found
      </div>
    )
  }

  const total  = h2h.played
  const aWidth = total ? ((h2h.team_a_wins / total) * 100).toFixed(0) : 0
  const dWidth = total ? ((h2h.draws        / total) * 100).toFixed(0) : 0
  const bWidth = total ? ((h2h.team_b_wins  / total) * 100).toFixed(0) : 0

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-body mb-1.5">
          <span className="font-medium text-accent">{h2h.team_a} ({h2h.team_a_wins}W)</span>
          <span className="text-muted">{h2h.draws}D</span>
          <span className="font-medium text-accent2">{h2h.team_b} ({h2h.team_b_wins}W)</span>
        </div>
        <div className="flex h-2 overflow-hidden gap-px">
          <div className="bg-accent transition-all" style={{ width: `${aWidth}%` }} />
          <div className="bg-border transition-all" style={{ width: `${dWidth}%` }} />
          <div className="bg-accent2 transition-all" style={{ width: `${bWidth}%` }} />
        </div>
        <div className="text-center text-xs text-muted mt-1.5">{total} meetings</div>
      </div>

      {h2h.matches?.length > 0 && (
        <div>
          <div className="text-xs text-muted mb-2 uppercase tracking-wider">Recent meetings</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {h2h.matches.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-surface2
                                       border border-border px-3 py-2 text-xs">
                <span className="text-muted w-10">{m.year}</span>
                <span className="text-body text-center flex-1">{m.stage}</span>
                <span className={`font-bold text-center w-12 ${m.score === '—' ? 'text-muted' : 'text-heading'}`}>
                  {m.score}
                </span>
                <span className={`text-right flex-1 font-medium
                  ${m.winner === h2h.team_a ? 'text-accent' :
                    m.winner === h2h.team_b ? 'text-accent2' :
                    'text-muted'}`}>
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