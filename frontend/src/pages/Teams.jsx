import { useState } from 'react'
import { teamsAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage   from '../components/ErrorMessage'
import WinDonut       from '../components/teams/WinDonut'
import GoalsChart     from '../components/teams/GoalsChart'
import MatchHistory   from '../components/teams/MatchHistory'

const CONFEDERATIONS = ['All','UEFA','CONMEBOL','CONCACAF','CAF','AFC','OTHER']

export default function Teams() {
  const [selectedId, setSelectedId] = useState(null)
  const [search,     setSearch]     = useState('')
  const [conf,       setConf]       = useState('All')

  // All teams for the sidebar list
  const { data: teamsData, loading: teamsLoading } =
    useFetch(() => teamsAPI.getAll({ per_page: 83 }))

  // Selected team stats
  const { data: statsData, loading: statsLoading } =
    useFetch(() => selectedId ? teamsAPI.getStats(selectedId) : Promise.resolve({ data: null }),
             [selectedId])

  // Selected team matches (all of them)
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
    <div className="flex h-screen overflow-hidden">

      {/* Team list sidebar */}
      <div className="w-64 shrink-0 border-r border-gray-800 flex flex-col
                      bg-gray-950 overflow-hidden">

        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-semibold mb-3">Nations</h2>
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                       text-sm text-white placeholder-gray-500 focus:outline-none
                       focus:border-blue-500 mb-2"
          />
          <select
            value={conf}
            onChange={e => setConf(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                       text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {CONFEDERATIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {teamsLoading ? (
            <LoadingSpinner text="Loading..." />
          ) : filtered.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-800/50
                          transition-colors flex items-center justify-between
                          ${selectedId === t.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <span className="text-sm font-medium truncate">{t.name}</span>
              <span className={`text-xs shrink-0 ml-2
                ${selectedId === t.id ? 'text-blue-200' : 'text-gray-600'}`}>
                {t.confederation}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">🌍</div>
            <div className="text-white font-semibold text-xl mb-2">
              Select a Nation
            </div>
            <div className="text-gray-500 text-sm max-w-xs">
              Choose a team from the list to view their World Cup record,
              goal history, and match results.
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Team header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {selectedTeam?.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5
                                   rounded-full">
                    {selectedTeam?.confederation}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {selectedTeam?.world_cups_played} World Cups
                  </span>
                </div>
              </div>
            </div>

            {/* Stats + Donut */}
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
                  <GoalsChart
                    matches={matches}
                    teamName={selectedTeam?.name}
                  />
                )}
              </div>
            </div>

            {/* Match history */}
            {matchesLoading ? (
              <LoadingSpinner text="Loading matches..." />
            ) : (
              <MatchHistory
                matches={matches}
                teamName={selectedTeam?.name}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}