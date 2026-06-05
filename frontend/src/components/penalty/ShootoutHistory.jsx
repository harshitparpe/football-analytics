export default function ShootoutHistory({ kicks, shooter, keeper }) {
  if (!kicks?.length) return null

  const scored = kicks.filter(k => k.scored).length

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Shootout Results</h3>
        <div className="flex items-center gap-2">
          {kicks.map((k, i) => (
            <span
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center
                          text-xs font-bold
                          ${k.scored
                            ? 'bg-green-800 text-green-300'
                            : 'bg-red-900 text-red-300'}`}
            >
              {k.scored ? '✓' : '✗'}
            </span>
          ))}
        </div>
      </div>

      {/* Score summary */}
      <div className="text-center py-3 mb-4 bg-gray-800 rounded-xl">
        <div className="text-4xl font-black text-white">
          {scored} / {kicks.length}
        </div>
        <div className="text-gray-400 text-sm mt-1">
          {shooter?.name} vs {keeper?.name}
        </div>
        <div className={`text-sm font-semibold mt-1
          ${scored >= kicks.length * 0.6 ? 'text-green-400' :
            scored >= kicks.length * 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
          {scored >= kicks.length * 0.6 ? '🔥 Hot streak' :
           scored >= kicks.length * 0.4 ? '⚖️ Evenly matched' :
           '🧤 Keeper dominates'}
        </div>
      </div>

      {/* Kick-by-kick breakdown */}
      <div className="space-y-2">
        {kicks.map((k, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg text-xs
              ${k.scored ? 'bg-green-950/40' : 'bg-gray-800/60'}`}
          >
            <span className={`font-bold w-4 shrink-0 mt-0.5
              ${k.scored ? 'text-green-400' : 'text-red-400'}`}>
              {k.kick_number}
            </span>
            <span className={k.scored ? 'text-gray-300' : 'text-gray-500'}>
              {k.reason}
            </span>
            <div className="ml-auto flex gap-1 shrink-0">
              <span className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                {k.shot_direction}
              </span>
              <span className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                {k.shot_height}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}