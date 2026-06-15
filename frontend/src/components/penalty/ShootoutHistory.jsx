export default function ShootoutHistory({ kicks, shooter, keeper }) {
  if (!kicks?.length) return null

  const scored = kicks.filter(k => k.scored).length

  return (
    <div className="card h-full p-5 overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-4">
        <div className="eyebrow">shootout_results</div>
        <div className="flex items-center gap-2">
          {kicks.map((k, i) => (
            <span
              key={i}
              className={`w-7 h-7 flex items-center justify-center
                          text-xs font-bold font-mono border
                          ${k.scored
                            ? 'bg-green-900/30 border-green-700 text-green-300'
                            : 'bg-red-900/30 border-red-700 text-red-300'}`}
            >
              {k.scored ? '✓' : '✗'}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center py-3 mb-4 bg-surface2 border border-border">
        <div className="font-display text-4xl font-bold text-heading">
          {scored} / {kicks.length}
        </div>
        <div className="text-body text-sm mt-1 font-mono">
          {shooter?.name} vs {keeper?.name}
        </div>
        <div className={`text-sm font-semibold mt-1 font-mono
          ${scored >= kicks.length * 0.6 ? 'text-green-400' :
            scored >= kicks.length * 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
          {scored >= kicks.length * 0.6 ? 'Hot Streak' :
           scored >= kicks.length * 0.4 ? 'Evenly Matched' :
           'Keeper Dominates'}
        </div>
      </div>

      <div className="space-y-2">
        {kicks.map((k, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 text-xs border
              ${k.scored ? 'bg-green-950/20 border-green-900/30' : 'bg-surface2 border-border'}`}
          >
            <span className={`font-bold w-4 shrink-0 mt-0.5 font-mono
              ${k.scored ? 'text-green-400' : 'text-red-400'}`}>
              {k.kick_number}
            </span>
            <span className={k.scored ? 'text-body' : 'text-muted'}>
              {k.reason}
            </span>
            <div className="ml-auto flex gap-1 shrink-0">
              <span className="bg-surface text-muted px-1.5 py-0.5 font-mono border border-border">
                {k.shot_direction}
              </span>
              <span className="bg-surface text-muted px-1.5 py-0.5 font-mono border border-border">
                {k.shot_height}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}