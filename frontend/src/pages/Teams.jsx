import { useState } from 'react'
import { teamsAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import LoadingSpinner from '../components/LoadingSpinner'
import WinDonut       from '../components/teams/WinDonut'
import GoalsChart     from '../components/teams/GoalsChart'
import MatchHistory   from '../components/teams/MatchHistory'

const CONFEDERATIONS = ['All','UEFA','CONMEBOL','CONCACAF','CAF','AFC','OTHER']

export default function Teams() {
  const [selectedId, setSelectedId] = useState(null)
  const [search,     setSearch]     = useState('')
  const [conf,       setConf]       = useState('All')

  const { data: teamsData, loading: teamsLoading } =
    useFetch(() => teamsAPI.getAll({ per_page: 83 }))

  const { data: statsData, loading: statsLoading } =
    useFetch(() => selectedId ? teamsAPI.getStats(selectedId) : Promise.resolve({ data: null }),
             [selectedId])

  const { data: matchesData, loading: matchesLoading } =
    useFetch(() => selectedId
      ? teamsAPI.getMatches(selectedId, { per_page: 200 })
      : Promise.resolve({ data: null }),
      [selectedId])

  const teams   = teamsData?.teams || []
  const stats   = statsData
  const matches = matchesData?.matches || []

  const filtered = teams.filter(t =>
    (conf === 'All' || t.confederation === conf) &&
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedTeam = teams.find(t => t.id === selectedId)

  return (
    <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">

      {/* Team list */}
      <div className="lg:w-64 shrink-0 border-r border-border lg:min-h-[calc(100vh-4rem)]">

        <div className="p-4 border-b border-border">
          <h2 className="text-heading font-semibold mb-3">Nations</h2>
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface2 border border-border px-3 py-2
                       text-sm text-heading placeholder-muted focus:outline-none
                       focus:border-accent mb-2"
          />
          <select
            value={conf}
            onChange={e => setConf(e.target.value)}
            className="w-full bg-surface2 border border-border px-3 py-2
                       text-sm text-heading focus:outline-none focus:border-accent"
          >
            {CONFEDERATIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="max-h-96 lg:max-h-[calc(100vh-12rem)] overflow-y-auto">
          {teamsLoading ? (
            <LoadingSpinner text="Loading..." />
          ) : filtered.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left px-4 py-3 border-b border-border/50
                          transition-colors flex items-center justify-between
                          ${selectedId === t.id
                            ? 'bg-accent text-bg'
                            : 'text-body hover:bg-surface2 hover:text-heading'}`}
            >
              <span className="text-sm font-medium truncate">{t.name}</span>
              <span className={`text-xs shrink-0 ml-2
                ${selectedId === t.id ? 'text-bg/70' : 'text-muted'}`}>
                {t.confederation}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="text-heading font-semibold text-xl mb-2">
              Select a Nation
            </div>
            <div className="text-body text-sm max-w-xs">
              Choose a team from the list to view their World Cup record,
              goal history, and match results.
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            <div>
              <h1 className="text-2xl font-semibold text-heading">
                {selectedTeam?.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs bg-surface2 text-body px-2 py-0.5
                                 border border-border">
                  {selectedTeam?.confederation}
                </span>
                <span className="text-muted text-sm">
                  {selectedTeam?.world_cups_played} World Cups
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                {statsLoading ? (
                  <LoadingSpinner text="Loading stats..." />
                ) : stats ? (
                  <WinDonut stats={stats} />
                ) : null}
              </div>

              <div className="lg:col-span-2">
                {matchesLoading ? (
                  <LoadingSpinner text="Loading match data..." />
                ) : (
                  <GoalsChart matches={matches} teamName={selectedTeam?.name} />
                )}
              </div>
            </div>

            {matchesLoading ? (
              <LoadingSpinner text="Loading matches..." />
            ) : (
              <MatchHistory matches={matches} teamName={selectedTeam?.name} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}