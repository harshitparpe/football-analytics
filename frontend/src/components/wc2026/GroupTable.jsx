export default function GroupTable({ groupLetter, standings, fixtures, onMatchClick }) {
  return (
    <div className="card p-4">
      <div className="text-heading font-semibold mb-3">Group {groupLetter}</div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="text-muted border-b border-border">
            <th className="text-left py-1.5">Team</th>
            <th className="text-center py-1.5">P</th>
            <th className="text-center py-1.5">W</th>
            <th className="text-center py-1.5">D</th>
            <th className="text-center py-1.5">L</th>
            <th className="text-center py-1.5">GD</th>
            <th className="text-center py-1.5">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((t, i) => (
            <tr key={t.team} className={`border-b border-border/40
              ${i < 2 ? 'text-heading' : 'text-body'}`}>
              <td className="py-1.5 truncate max-w-24">{t.team}</td>
              <td className="text-center">{t.played}</td>
              <td className="text-center">{t.won}</td>
              <td className="text-center">{t.drawn}</td>
              <td className="text-center">{t.lost}</td>
              <td className="text-center">{t.gf - t.ga}</td>
              <td className="text-center font-semibold text-accent">{t.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1.5">
        {fixtures.map(f => (
          <button
            key={f.match_number}
            onClick={() => onMatchClick(f)}
            className={`w-full flex items-center justify-between text-xs px-2 py-1.5
                        border transition-colors hover:border-accent
                        ${f.is_played
                          ? (f.prediction_correct === true ? 'border-green-600/50' :
                             f.prediction_correct === false ? 'border-red-600/50' : 'border-border')
                          : 'border-border'}`}
          >
            <span className="text-body truncate">{f.team_a} vs {f.team_b}</span>
            <span className="text-muted font-mono shrink-0 ml-2">
              {f.is_played ? `${f.actual.score_a}-${f.actual.score_b}` : '—'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}