import { useState } from 'react'
import { teamsAPI, predictAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import TeamSelector     from '../components/dashboard/TeamSelector'
import ProbabilityChart from '../components/predictions/ProbabilityChart'
import HeadToHead       from '../components/predictions/HeadToHead'
import ModelInfo        from '../components/predictions/ModelInfo'
import LoadingSpinner   from '../components/LoadingSpinner'

export default function Predictions() {
  const [teamAId, setTeamAId] = useState(null)
  const [teamBId, setTeamBId] = useState(null)
  const [result,  setResult]  = useState(null)
  const [h2h,     setH2h]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const { data: teamsData, loading: teamsLoading } =
    useFetch(() => teamsAPI.getAll({ per_page: 83 }))

  const teams = teamsData?.teams || []

  const handlePredict = async () => {
    if (!teamAId || !teamBId) return
    if (teamAId === teamBId) {
      setError('Please select two different teams.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setH2h(null)

    try {
      const [predRes, h2hRes] = await Promise.all([
        predictAPI.predictMatch(teamAId, teamBId),
        teamsAPI.headToHead(teamAId, teamBId),
      ])
      setResult(predRes.data)
      setH2h(h2hRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = () => {
    setTeamAId(teamBId)
    setTeamBId(teamAId)
    setResult(null)
    setH2h(null)
    setError('')
  }

  const canPredict = teamAId && teamBId && teamAId !== teamBId && !loading

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      <div>
        <h1 className="text-2xl font-semibold text-heading">Match Predictions</h1>
        <p className="text-body text-sm mt-1">
          Random Forest model trained on 852 historical World Cup matches
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 space-y-5">

          <div className="card p-5">
            <h2 className="text-heading font-semibold mb-4">Select Teams</h2>

            {teamsLoading ? (
              <LoadingSpinner text="Loading teams..." />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted mb-1.5 block">Team A</label>
                  <TeamSelector
                    teams={teams}
                    value={teamAId}
                    onChange={setTeamAId}
                    placeholder="Select team A..."
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleSwap}
                  disabled={!teamAId && !teamBId}
                  className="mt-5 p-2.5 bg-surface2 border border-border text-body
                             hover:text-accent hover:border-accent transition-colors
                             disabled:opacity-30"
                  title="Swap teams"
                >
                  ⇄
                </button>

                <div className="flex-1">
                  <label className="text-xs text-muted mb-1.5 block">Team B</label>
                  <TeamSelector
                    teams={teams}
                    value={teamBId}
                    onChange={setTeamBId}
                    placeholder="Select team B..."
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 text-accent2 text-sm bg-surface2
                              border border-border px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              onClick={handlePredict}
              disabled={!canPredict}
              className="mt-4 w-full bg-accent hover:bg-accent2
                         disabled:bg-surface2 disabled:text-muted
                         text-bg font-semibold py-3 text-sm transition-colors"
            >
              {loading ? 'Running model...' : 'Predict Match'}
            </button>
          </div>

          {loading && <LoadingSpinner text="Running Random Forest model..." />}

          {result && !loading && (
            <div className="card p-5">
              <h2 className="text-heading font-semibold mb-5">
                {result.team_a.name}
                <span className="text-muted mx-2">vs</span>
                {result.team_b.name}
              </h2>
              <ProbabilityChart result={result} />
            </div>
          )}

          {/* Model Info now lives in the left column */}
          <div className="card p-5">
            <h2 className="text-heading font-semibold mb-4">Model Info</h2>
            <ModelInfo />
          </div>
        </div>

        <div className="space-y-4">

          {/* Head to Head now lives in the right column */}
          <div className="card p-5">
            <h2 className="text-heading font-semibold mb-4">Head to Head</h2>
            {h2h && !loading ? (
              <HeadToHead h2h={h2h} />
            ) : (
              <div className="text-center py-6 text-muted text-sm">
                {loading ? 'Loading...' : 'Run a prediction to see head-to-head history'}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="text-accent text-xs font-semibold mb-2 uppercase tracking-wider">
              How it works
            </div>
            <div className="text-body text-xs space-y-1.5 leading-relaxed">
              <p>The model uses 10 features per team — historical win rate,
              goals for/against, expected goals (xG), and World Cup experience.</p>
              <p>Features are computed excluding the target match to
              prevent data leakage.</p>
              <p>Probabilities are normalised to sum to 100%.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}