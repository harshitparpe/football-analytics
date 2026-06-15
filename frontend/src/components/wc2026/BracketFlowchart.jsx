const STAGE_LABELS = {
  round_of_32:  'Round of 32',
  round_of_16:  'Round of 16',
  quarterfinal: 'Quarterfinal',
  semifinal:    'Semifinal',
  third_place:  'Third Place',
  final:        'Final',
}

const STAGE_ORDER = ['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'final', 'third_place']

function MatchCard({ fixture, onClick }) {
  const hasResult = fixture.is_played
  const hasPred   = !!fixture.prediction

  let borderColor = 'border-border'
  if (hasResult && hasPred) {
    borderColor = fixture.prediction_correct ? 'border-green-600' : 'border-red-600'
  } else if (hasPred) {
    borderColor = 'border-accent/40'
  }

  return (
    <button
      onClick={() => onClick(fixture)}
      className={`card ${borderColor} border w-44 p-2.5 text-left
                  hover:border-accent transition-colors shrink-0`}
    >
      <div className="text-xs text-muted mb-1.5">#{fixture.match_number}</div>

      {[
        { name: fixture.team_a, score: fixture.actual?.score_a, prob: fixture.prediction?.team_a_prob },
        { name: fixture.team_b, score: fixture.actual?.score_b, prob: fixture.prediction?.team_b_prob },
      ].map((side, i) => {
        const isWinner = hasResult && fixture.actual.winner === side.name
        const isPredWinner = hasPred && fixture.prediction.winner === side.name
        return (
          <div key={i} className={`flex items-center justify-between text-sm py-0.5
            ${isWinner ? 'text-heading font-semibold' : 'text-body'}`}>
            <span className="truncate flex items-center gap-1">
              {side.name}
              {isPredWinner && !hasResult && (
                <span className="text-accent text-xs">★</span>
              )}
            </span>
            <span className="font-mono text-xs ml-2 shrink-0">
              {hasResult ? side.score : (side.prob != null ? `${(side.prob * 100).toFixed(0)}%` : '—')}
            </span>
          </div>
        )
      })}

      {hasResult && hasPred && (
        <div className={`mt-1.5 text-xs font-medium
          ${fixture.prediction_correct ? 'text-green-400' : 'text-red-400'}`}>
          {fixture.prediction_correct ? '✓ Predicted correctly' : '✗ Predicted wrong'}
        </div>
      )}
    </button>
  )
}

export default function BracketFlowchart({ fixturesByStage, onMatchClick }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {STAGE_ORDER.map(stage => {
          const fixtures = fixturesByStage[stage] || []
          if (!fixtures.length) return null

          return (
            <div key={stage} className="flex flex-col gap-4">
              <div className="text-xs text-muted uppercase tracking-wider sticky top-0
                              bg-bg py-1 text-center">
                {STAGE_LABELS[stage]}
              </div>
              <div className="flex flex-col gap-4 justify-around flex-1">
                {fixtures.map(f => (
                  <MatchCard key={f.match_number} fixture={f} onClick={onMatchClick} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}