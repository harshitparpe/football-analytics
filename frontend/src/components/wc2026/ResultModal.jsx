import { useState } from 'react'

export default function ResultModal({ fixture, onClose, onSave }) {
  const [scoreA, setScoreA] = useState(fixture.actual?.score_a ?? '')
  const [scoreB, setScoreB] = useState(fixture.actual?.score_b ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async () => {
    if (scoreA === '' || scoreB === '') {
      setError('Enter both scores')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(fixture.match_number, parseInt(scoreA), parseInt(scoreB))
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="text-xs text-muted mb-1">Match #{fixture.match_number} · {fixture.round_name}</div>
        <h3 className="text-heading font-semibold mb-4">
          {fixture.team_a} vs {fixture.team_b}
        </h3>

        {fixture.prediction && (
          <div className="mb-4 p-3 bg-surface2 border border-border text-xs">
            <div className="text-muted mb-1">Model prediction</div>
            <div className="flex justify-between text-body">
              <span>{fixture.team_a}: {(fixture.prediction.team_a_prob * 100).toFixed(0)}%</span>
              <span>Draw: {(fixture.prediction.draw_prob * 100).toFixed(0)}%</span>
              <span>{fixture.team_b}: {(fixture.prediction.team_b_prob * 100).toFixed(0)}%</span>
            </div>
            <div className="text-accent mt-1 font-medium">
              Predicted: {fixture.prediction.winner}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-muted mb-1 block truncate">{fixture.team_a}</label>
            <input
              type="number" min="0" value={scoreA}
              onChange={e => setScoreA(e.target.value)}
              className="w-full bg-surface2 border border-border px-3 py-2
                         text-heading text-center text-lg focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-muted mt-5">—</span>
          <div className="flex-1">
            <label className="text-xs text-muted mb-1 block truncate">{fixture.team_b}</label>
            <input
              type="number" min="0" value={scoreB}
              onChange={e => setScoreB(e.target.value)}
              className="w-full bg-surface2 border border-border px-3 py-2
                         text-heading text-center text-lg focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-300 text-xs bg-red-950/40 border border-red-900 px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm border border-border text-body hover:text-heading transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 text-sm bg-accent hover:bg-accent2 text-bg font-semibold
                       disabled:bg-surface2 disabled:text-muted transition-colors">
            {saving ? 'Saving...' : 'Save Result'}
          </button>
        </div>
      </div>
    </div>
  )
}