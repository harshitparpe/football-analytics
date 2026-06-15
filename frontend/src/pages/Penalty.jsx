import { useState } from 'react'
import { penaltyAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import PenaltyResult   from '../components/penalty/PenaltyResult'
import ShootoutHistory from '../components/penalty/ShootoutHistory'
import LoadingSpinner  from '../components/LoadingSpinner'

// Compact searchable player picker — selected player shown as a slim inline row,
// not a full card, to save vertical space.
function PlayerSearch({ players, value, onChange, placeholder, accentClass, skillKey }) {
  const [query, setQuery] = useState('')
  const selected = players.find(p => p.id === value)

  const filtered = query.length >= 2
    ? players.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.team || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)
    : []

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={`Search ${placeholder}... (min 2 chars)`}
        className="w-full bg-surface2 border border-border px-3 py-2
                   text-sm text-heading placeholder-muted
                   focus:outline-none focus:border-accent transition-colors"
      />

      {query.length >= 2 && (
        <div className="max-h-32 overflow-y-auto border border-border
                        bg-surface2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-muted text-xs">No players found</div>
          ) : filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange(p.id); setQuery('') }}
              className={`w-full text-left px-3 py-1.5 text-sm
                          transition-colors flex items-center justify-between gap-2
                          border-b border-border last:border-b-0
                          ${value === p.id
                            ? `${accentClass} text-bg`
                            : 'text-body hover:bg-surface hover:text-heading'}`}
            >
              <span className="truncate">{p.name}</span>
              <div className="flex items-center gap-2 shrink-0 text-xs opacity-70">
                <span className="truncate max-w-20">{p.team}</span>
                <span className="font-semibold">{(p[skillKey] * 100).toFixed(0)}%</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Compact selected-player summary */}
      {selected && (
        <div className="flex items-center justify-between gap-3 px-3 py-2
                        bg-surface2 border border-border">
          <div className="min-w-0">
            <div className="text-heading text-sm font-medium truncate">{selected.name}</div>
            <div className="text-muted text-xs truncate">
              {selected.team} · {selected.position}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className="w-16 bg-surface h-1.5">
              <div
                className={`h-1.5 ${accentClass}`}
                style={{ width: `${selected[skillKey] * 100}%` }}
              />
            </div>
            <span className="text-heading text-xs font-semibold w-9 text-right">
              {(selected[skillKey] * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Penalty() {
  const [shooterId, setShooterId] = useState(null)
  const [keeperId,  setKeeperId]  = useState(null)
  const [result,    setResult]    = useState(null)
  const [shootout,  setShootout]  = useState(null)
  const [animating, setAnimating] = useState(false)
  const [mode,      setMode]      = useState('single')
  const [error,     setError]     = useState('')

  const { data: playersData, loading: playersLoading } =
    useFetch(() => penaltyAPI.getPlayers())

  const shooters = playersData?.shooters || []
  const keepers  = playersData?.keepers  || []

  const selectedShooter = shooters.find(p => p.id === shooterId) || null
  const selectedKeeper  = keepers.find(p => p.id === keeperId)   || null

  const canShoot = shooterId && keeperId && !animating

  const handleReset = () => {
    setResult(null)
    setShootout(null)
    setError('')
  }

  const handleSimulate = async () => {
    if (!canShoot) return
    setAnimating(true)
    setResult(null)
    setShootout(null)
    setError('')

    const [res] = await Promise.all([
      penaltyAPI.simulate({ shooter_id: shooterId, keeper_id: keeperId }),
      new Promise(r => setTimeout(r, 900)),
    ]).catch(err => {
      setError(err.response?.data?.error || 'Simulation failed.')
      setAnimating(false)
      return [null]
    })

    if (res) setResult(res.data)
    setAnimating(false)
  }

  const handleShootout = async () => {
    if (!canShoot) return
    setAnimating(true)
    setResult(null)
    setShootout(null)
    setError('')

    const [res] = await Promise.all([
      penaltyAPI.shootout({ shooter_id: shooterId, keeper_id: keeperId, kicks: 5 }),
      new Promise(r => setTimeout(r, 1200)),
    ]).catch(err => {
      setError(err.response?.data?.error || 'Shootout failed.')
      setAnimating(false)
      return [null]
    })

    if (res) setShootout(res.data)
    setAnimating(false)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full overflow-hidden">

      <div className="mb-4 shrink-0">
        <h1 className="font-display text-2xl font-semibold text-heading">Penalty Simulator</h1>
        <p className="text-body text-sm mt-1">
          {playersData?.shooter_count || '—'} shooters · {playersData?.keeper_count || '—'} keepers available
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Left column — controls */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-thin pr-1">

          <div className="card p-1 flex gap-1 shrink-0">
            {['single', 'shootout'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); handleReset() }}
                className={`flex-1 py-2 text-sm font-medium transition-colors
                            ${mode === m
                              ? 'bg-accent text-bg'
                              : 'text-muted hover:text-heading'}`}
              >
                {m === 'single' ? 'Single Kick' : '5-Kick Shootout'}
              </button>
            ))}
          </div>

          {playersLoading ? (
            <LoadingSpinner text="Loading players..." />
          ) : (
            <>
              <div className="card p-3 shrink-0">
                <div className="text-xs text-muted uppercase tracking-wider mb-2">Shooter</div>
                <PlayerSearch
                  players={shooters}
                  value={shooterId}
                  onChange={(id) => { setShooterId(id); handleReset() }}
                  placeholder="shooter"
                  accentClass="bg-accent"
                  skillKey="penalty_skill"
                />
              </div>

              <div className="card p-3 shrink-0">
                <div className="text-xs text-muted uppercase tracking-wider mb-2">Keeper</div>
                <PlayerSearch
                  players={keepers}
                  value={keeperId}
                  onChange={(id) => { setKeeperId(id); handleReset() }}
                  placeholder="keeper"
                  accentClass="bg-amber-500"
                  skillKey="save_skill"
                />
              </div>
            </>
          )}

          <button
            onClick={mode === 'single' ? handleSimulate : handleShootout}
            disabled={!canShoot}
            className="w-full py-3 font-display font-semibold text-sm
                       transition-colors bg-accent hover:bg-accent2
                       text-bg disabled:bg-surface2 disabled:text-muted shrink-0"
          >
            {animating ? 'Simulating...'
              : mode === 'single' ? 'Take Penalty'
              : 'Run Shootout'}
          </button>

          {error && (
            <div className="border border-red-900 bg-red-950/40 text-red-300
                            text-sm px-4 py-2.5 shrink-0">
              {error}
            </div>
          )}

          {(result || shootout) && !animating && (
            <button
              onClick={mode === 'single' ? handleSimulate : handleShootout}
              className="w-full py-2 text-sm
                         bg-surface2 hover:bg-surface text-body
                         transition-colors border border-border shrink-0"
            >
              Try again
            </button>
          )}
        </div>

        {/* Right column — result */}
        <div className="xl:col-span-2 min-h-0 overflow-y-auto scrollbar-thin">

          {!result && !shootout && !animating && (
            <div className="card h-full p-8 flex flex-col items-center justify-center text-center">
              <div className="font-display text-heading font-semibold text-lg mb-2">
                Ready to simulate
              </div>
              <div className="text-body text-sm max-w-xs">
                Search and select a shooter and keeper, then run the simulation.
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                {[
                  { label: '1', title: 'Shooter picks', desc: 'Direction + height by style' },
                  { label: '2', title: 'Keeper dives',  desc: 'Based on dive tendency' },
                  { label: '3', title: 'Result',        desc: 'Probabilities decide outcome' },
                ].map((s, i) => (
                  <div key={i} className="card p-3 text-center">
                    <div className="text-accent text-xs font-semibold mb-1">{s.label}</div>
                    <div className="text-heading text-xs font-medium">{s.title}</div>
                    <div className="text-muted text-xs mt-1 leading-relaxed">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(result || animating) && mode === 'single' && (
            <PenaltyResult result={result} animating={animating} />
          )}

          {animating && mode === 'shootout' && (
            <div className="card h-full p-8 flex flex-col items-center justify-center">
              <div className="text-5xl animate-bounce mb-4">⚽</div>
              <div className="text-body text-sm">Running 5-kick shootout...</div>
            </div>
          )}

          {shootout && !animating && mode === 'shootout' && (
            <ShootoutHistory
              kicks={shootout.kicks_detail}
              shooter={selectedShooter}
              keeper={selectedKeeper}
            />
          )}
        </div>
      </div>
    </div>
  )
}