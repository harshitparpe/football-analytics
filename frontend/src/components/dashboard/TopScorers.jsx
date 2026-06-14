export default function TopScorers({ scorers }) {
  if (!scorers.length) return null

  const max = scorers[0]?.goals || 1

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-heading font-semibold">Top Scorers</h2>
        <p className="text-xs text-muted mt-0.5">All-time World Cup goals</p>
      </div>

      <div className="divide-y divide-border/50">
        {scorers.map((p, idx) => (
          <div key={p.id} className="px-5 py-3 hover:bg-surface2 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold w-5 text-center
                  ${idx === 0 ? 'text-accent' :
                    idx === 1 ? 'text-body' :
                    idx === 2 ? 'text-accent2' : 'text-muted'}`}>
                  {idx + 1}
                </span>
                <div>
                  <div className="text-heading text-sm font-medium leading-tight">
                    {p.name}
                  </div>
                  <div className="text-muted text-xs">
                    {p.team_name} · {p.position}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-heading font-bold text-sm">{p.goals}</span>
                <span className="text-muted text-xs ml-1">goals</span>
              </div>
            </div>

            <div className="ml-7 bg-surface2 h-1.5 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${(p.goals / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}