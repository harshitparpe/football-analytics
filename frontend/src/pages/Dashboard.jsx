import { useState, useEffect } from 'react'
import { teamsAPI, playersAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import StatCard       from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage   from '../components/ErrorMessage'
import LeagueTable    from '../components/dashboard/LeagueTable'
import TopScorers     from '../components/dashboard/TopScorers'
import TournamentStats from '../components/dashboard/TournamentStats'

export default function Dashboard() {
  const {
    data: teamsData,
    loading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useFetch(() => teamsAPI.getAll({ per_page: 83 }))

  const {
    data: scorersData,
    loading: scorersLoading,
  } = useFetch(() => playersAPI.getTopScorers(10))

  const {
    data: avgData,
    loading: avgLoading,
  } = useFetch(() => teamsAPI.getTournamentAverages())

  const teams   = teamsData?.teams   || []
  const scorers = scorersData?.top_scorers || []
  const avgs    = avgData || {}

  // Derive summary stats from team data
  const totalMatches  = teams.reduce((s, t) => s + (t.world_cups_played || 0), 0)
  const topConf       = (() => {
    const counts = {}
    teams.forEach(t => { counts[t.confederation] = (counts[t.confederation] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  })()

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          FIFA World Cup 1930–2014 · Historical Analytics
        </p>
      </div>

      {/* Stat cards */}
      {avgLoading || teamsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700
                                    rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="🏆" color="amber"
            label="Total Matches"
            value={avgs.total_matches?.toLocaleString() || '—'}
            sub="World Cup history"
          />
          <StatCard
            icon="⚽" color="green"
            label="Avg Goals / Match"
            value={avgs.avg_goals_per_match || '—'}
            sub={`xG avg: ${avgs.avg_xg || '—'}`}
          />
          <StatCard
            icon="🌍" color="blue"
            label="Nations"
            value={teams.length}
            sub={`Most: ${topConf}`}
          />
          <StatCard
            icon="🎯" color="purple"
            label="Avg Shots / Match"
            value={avgs.avg_shots || '—'}
            sub={`On target: ${avgs.avg_shots_on_target || '—'}`}
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* League table — takes 2/3 width on xl */}
        <div className="xl:col-span-2">
          {teamsLoading ? (
            <LoadingSpinner text="Loading teams..." />
          ) : teamsError ? (
            <ErrorMessage message={teamsError} onRetry={refetchTeams} />
          ) : (
            <LeagueTable teams={teams} />
          )}
        </div>

        {/* Top scorers — takes 1/3 */}
        <div>
          {scorersLoading ? (
            <LoadingSpinner text="Loading scorers..." />
          ) : (
            <TopScorers scorers={scorers} />
          )}
        </div>
      </div>

      {/* Tournament stats bar chart */}
      <TournamentStats />

    </div>
  )
}