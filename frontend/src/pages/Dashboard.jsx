import { useState, useEffect } from 'react'
import { teamsAPI, playersAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import StatCard        from '../components/Statcard'
import LoadingSpinner  from '../components/LoadingSpinner'
import ErrorMessage    from '../components/ErrorMessage'
import LeagueTable     from '../components/dashboard/LeagueTable'
import TopScorers      from '../components/dashboard/TopScorers'
import TournamentStats from '../components/dashboard/TournamentStats'
import {
  StatCardSkeleton,
  ScorerRowSkeleton,
  TableRowSkeleton,
} from '../components/Skeleton'

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

  const teams   = teamsData?.teams        || []
  const scorers = scorersData?.top_scorers || []
  const avgs    = avgData || {}

  const topConf = (() => {
    const counts = {}
    teams.forEach(t => { counts[t.confederation] = (counts[t.confederation] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  })()

  return (
    <div className="p-4 md:p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          FIFA World Cup 1930–2014 · Historical Analytics
        </p>
      </div>

      {/* Stat cards with skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {avgLoading || teamsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon="🏆" color="amber" label="Total Matches"
              value={avgs.total_matches?.toLocaleString() || '—'}
              sub="World Cup history" />
            <StatCard icon="⚽" color="green" label="Avg Goals / Match"
              value={avgs.avg_goals_per_match || '—'}
              sub={`xG avg: ${avgs.avg_xg || '—'}`} />
            <StatCard icon="🌍" color="blue" label="Nations"
              value={teams.length}
              sub={`Most: ${topConf}`} />
            <StatCard icon="🎯" color="purple" label="Avg Shots / Match"
              value={avgs.avg_shots || '—'}
              sub={`On target: ${avgs.avg_shots_on_target || '—'}`} />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {teamsLoading ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="h-5 bg-gray-800 rounded w-24 animate-pulse" />
              </div>
              <table className="w-full">
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={4} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : teamsError ? (
            <ErrorMessage message={teamsError} onRetry={refetchTeams} />
          ) : (
            <LeagueTable teams={teams} />
          )}
        </div>

        <div>
          {scorersLoading ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="h-5 bg-gray-800 rounded w-28 animate-pulse mb-1" />
                <div className="h-3 bg-gray-800 rounded w-40 animate-pulse" />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <ScorerRowSkeleton key={i} />
              ))}
            </div>
          ) : (
            <TopScorers scorers={scorers} />
          )}
        </div>
      </div>

      <TournamentStats />
    </div>
  )
}