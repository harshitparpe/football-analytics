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
    <span className="ml-1 text-muted">
      {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div className="card">

      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-heading font-semibold">All Nations</h2>
          <span className="text-xs text-muted">{filtered.length} teams</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="bg-surface2 border border-border px-3 py-1.5
                       text-sm text-heading placeholder-muted focus:outline-none
                       focus:border-accent w-40"
          />
          <select
            value={confFilter}
            onChange={e => { setConf(e.target.value); setPage(1) }}
            className="bg-surface2 border border-border px-3 py-1.5
                       text-sm text-heading focus:outline-none focus:border-accent"
          >
            {CONFEDERATIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs border-b border-border">
              <th className="text-left px-5 py-3 w-8">#</th>
              <th className="text-left px-3 py-3">Team</th>
              <th className="text-center px-3 py-3">Conf</th>
              <th
                className="text-center px-3 py-3 cursor-pointer hover:text-heading"
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
                className="border-b border-border/50 hover:bg-surface2
                           transition-colors"
              >
                <td className="px-5 py-3 text-muted text-xs">
                  {(page - 1) * PER_PAGE + idx + 1}
                </td>
                <td className="px-3 py-3">
                  <span className="text-heading font-medium">{team.name}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs bg-surface2 text-body px-2 py-0.5
                                   border border-border">
                    {team.confederation}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-body">
                  {team.world_cups_played ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center
                        justify-between">
          <span className="text-xs text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1.5 bg-surface2 border border-border
                         text-body hover:text-heading hover:border-accent
                         disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs px-3 py-1.5 bg-surface2 border border-border
                         text-body hover:text-heading hover:border-accent
                         disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}