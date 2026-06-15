import { useState } from 'react'
import { wc2026API } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import LoadingSpinner from '../components/LoadingSpinner'
import BracketFlowchart from '../components/wc2026/BracketFlowchart'
import GroupTable from '../components/wc2026/GroupTable'
import ResultModal from '../components/wc2026/ResultModal'

export default function WC2026() {
  const [view, setView] = useState('groups')   // 'groups' | 'bracket'
  const [selectedFixture, setSelectedFixture] = useState(null)

  const { data: fixturesData, loading: fixturesLoading, refetch: refetchFixtures } =
    useFetch(() => wc2026API.getFixtures())

  const { data: standingsData, loading: standingsLoading, refetch: refetchStandings } =
    useFetch(() => wc2026API.getStandings())

  const { data: summaryData, refetch: refetchSummary } =
    useFetch(() => wc2026API.getSummary())

  const fixturesByStage = fixturesData || {}
  const standings = standingsData?.standings || {}
  const summary = summaryData || {}

  const groupFixtures = fixturesByStage.group || []
  const groupsByLetter = {}
  groupFixtures.forEach(f => {
    if (!groupsByLetter[f.group_name]) groupsByLetter[f.group_name] = []
    groupsByLetter[f.group_name].push(f)
  })

  const handleSaveResult = async (matchNumber, scoreA, scoreB) => {
    await wc2026API.recordResult({ match_number: matchNumber, score_a: scoreA, score_b: scoreB })
    refetchFixtures()
    refetchStandings()
    refetchSummary()
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">World Cup 2026</h1>
          <p className="text-body text-sm mt-1">
            48 teams · 12 groups · Live prediction tracking
          </p>
        </div>

        <div className="card p-1 flex gap-1">
          {[
            { key: 'groups',  label: 'Group Stage' },
            { key: 'bracket', label: 'Knockout Bracket' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors
                          ${view === key ? 'bg-accent text-bg' : 'text-muted hover:text-heading'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Accuracy summary */}
      {summary.predicted > 0 && (
        <div className="card p-4 flex items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-heading">{summary.played}</div>
            <div className="text-xs text-muted">Matches played</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <div className="text-2xl font-bold text-heading">{summary.correct}/{summary.predicted}</div>
            <div className="text-xs text-muted">Correct predictions</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <div className="text-2xl font-bold text-accent">
              {summary.accuracy != null ? `${(summary.accuracy * 100).toFixed(0)}%` : '—'}
            </div>
            <div className="text-xs text-muted">Live accuracy</div>
          </div>
        </div>
      )}

      {/* Placeholder warning */}
      {/* <div className="card border-amber-700/50 p-3 text-xs text-amber-300">
        Fixtures use placeholder team names until the official December 2025 draw.
        Edit <code className="bg-surface2 px-1">etl/seed_wc2026.py</code> and re-run
        <code className="bg-surface2 px-1 ml-1">python -m etl.seed_wc2026</code> once groups are confirmed.
      </div> */}

      {fixturesLoading || standingsLoading ? (
        <LoadingSpinner text="Loading fixtures..." />
      ) : view === 'groups' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(standings).sort().map(letter => (
            <GroupTable
              key={letter}
              groupLetter={letter}
              standings={standings[letter]}
              fixtures={groupsByLetter[letter] || []}
              onMatchClick={setSelectedFixture}
            />
          ))}
        </div>
      ) : (
        <div className="card p-4">
          <BracketFlowchart
            fixturesByStage={fixturesByStage}
            onMatchClick={setSelectedFixture}
          />
        </div>
      )}

      {selectedFixture && (
        <ResultModal
          fixture={selectedFixture}
          onClose={() => setSelectedFixture(null)}
          onSave={handleSaveResult}
        />
      )}
    </div>
  )
}