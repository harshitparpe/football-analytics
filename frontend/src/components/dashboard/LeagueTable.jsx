import { useState } from 'react'

const CONFEDERATIONS = ['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OTHER']

export default function LeagueTable({ teams }) {
  const [search, setSearch]   = useState('')
  const [confFilter, setConf] = useState('All')
  const [sortBy, setSortBy]   = useState('world_cups_played')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage]       = useState(1)
  const PER_PAGE = 15

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
    setPage(1)
  }

  const filtered = teams
    .filter(t =>
      (confFilter === 'All' || t.confederation === confFilter) &&
      t.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortBy] ?? 0
      const bv = b[sortBy] ?? 0
      return sortDir === 'asc' ? av - bv : bv - av
    })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const visible    = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const SortIcon = ({ col }) => (
    <span className="ml-1 text-gray-600">
      {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">All Nations</h2>
          <span className="text-xs text-gray-500">{filtered.length} teams</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5
                       text-sm text-white placeholder-gray-500 focus:outline-none
                       focus:border-blue-500 w-40"
          />
          <select
            value={confFilter}
            onChange={e => { setConf(e.target.value); setPage(1) }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5
                       text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {CONFEDERATIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left px-5 py-3 w-8">#</th>
              <th className="text-left px-3 py-3">Team</th>
              <th className="text-center px-3 py-3">Conf</th>
              <th
                className="text-center px-3 py-3 cursor-pointer hover:text-gray-300"
                onClick={() => handleSort('world_cups_played')}
              >
                WCs <SortIcon col="world_cups_played" />
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((team, idx) => (
              <tr
                key={team.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/40
                           transition-colors"
              >
                <td className="px-5 py-3 text-gray-600 text-xs">
                  {(page - 1) * PER_PAGE + idx + 1}
                </td>
                <td className="px-3 py-3">
                  <span className="text-white font-medium">{team.name}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5
                                   rounded-full">
                    {team.confederation}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-gray-300">
                  {team.world_cups_played ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-800 flex items-center
                        justify-between">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800
                         text-gray-400 hover:text-white disabled:opacity-40
                         transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800
                         text-gray-400 hover:text-white disabled:opacity-40
                         transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}