export default function TopScorers({ scorers }) {
  if (!scorers.length) return null

  const max = scorers[0]?.goals || 1

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-white font-semibold">Top Scorers</h2>
        <p className="text-xs text-gray-500 mt-0.5">All-time World Cup goals</p>
      </div>

      <div className="divide-y divide-gray-800/50">
        {scorers.map((p, idx) => (
          <div key={p.id} className="px-5 py-3 hover:bg-gray-800/30
                                     transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold w-5 text-center
                  ${idx === 0 ? 'text-amber-400' :
                    idx === 1 ? 'text-gray-300' :
                    idx === 2 ? 'text-amber-700' : 'text-gray-600'}`}>
                  {idx + 1}
                </span>
                <div>
                  <div className="text-white text-sm font-medium leading-tight">
                    {p.name}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {p.team_name} · {p.position}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-bold text-sm">{p.goals}</span>
                <span className="text-gray-600 text-xs ml-1">goals</span>
              </div>
            </div>

            {/* Goal bar */}
            <div className="ml-7 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-green-300 rounded-full transition-all duration-500"
                style={{ width: `${(p.goals / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}