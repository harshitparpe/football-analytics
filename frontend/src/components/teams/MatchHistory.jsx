import { useState } from 'react'

export default function MatchHistory({ matches, teamName }) {
  const [filter, setFilter] = useState('all')

  const filtered = matches.filter(m => {
    if (filter === 'wins')   return m.winner === teamName
    if (filter === 'losses') return m.winner !== teamName && m.winner !== 'Draw'
    if (filter === 'draws')  return m.winner === 'Draw'
    return true
  })

  const resultStyle = (m) => {
    if (m.winner === teamName)  return 'text-green-400'
    if (m.winner === 'Draw')    return 'text-gray-400'
    return 'text-red-400'
  }

  const resultLabel = (m) => {
    if (m.winner === teamName) return 'W'
    if (m.winner === 'Draw')   return 'D'
    return 'L'
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Match History</h3>
          <span className="text-xs text-gray-500">{filtered.length} matches</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { key: 'all',    label: 'All'    },
            { key: 'wins',   label: 'Wins'   },
            { key: 'draws',  label: 'Draws'  },
            { key: 'losses', label: 'Losses' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                          ${filter === key
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 hover:text-gray-300 bg-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600 text-xs border-b border-gray-800">
              <th className="text-left px-5 py-2.5">Year</th>
              <th className="text-left px-3 py-2.5">Stage</th>
              <th className="text-left px-3 py-2.5">Opponent</th>
              <th className="text-center px-3 py-2.5">Score</th>
              <th className="text-center px-3 py-2.5">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map((m, i) => {
              const isTeamA    = m.team_a_name === teamName
              const opponent   = isTeamA ? m.team_b_name : m.team_a_name
              const scoreStr   = m.score_a !== null
                ? (isTeamA ? `${m.score_a}–${m.score_b}` : `${m.score_b}–${m.score_a}`)
                : '—'

              return (
                <tr key={i}
                  className="border-b border-gray-800/40 hover:bg-gray-800/30
                             transition-colors">
                  <td className="px-5 py-2.5 text-gray-400">{m.year}</td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{m.stage}</td>
                  <td className="px-3 py-2.5 text-white">{opponent}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-gray-300">
                    {scoreStr}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-bold text-xs ${resultStyle(m)}`}>
                      {resultLabel(m)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length > 30 && (
          <div className="px-5 py-3 text-xs text-gray-600 border-t border-gray-800">
            Showing 30 of {filtered.length} matches
          </div>
        )}
      </div>
    </div>
  )
}