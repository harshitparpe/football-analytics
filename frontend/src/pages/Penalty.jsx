import { useState } from 'react'
import { penaltyAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import PenaltyResult   from '../components/penalty/PenaltyResult'
import ShootoutHistory from '../components/penalty/ShootoutHistory'
import LoadingSpinner  from '../components/LoadingSpinner'

// Search-gated list — renders nothing until 2+ chars typed.
// Necessary at ~5000 shooters / ~450 keepers scale.
function PlayerSearch({ players, value, onChange, placeholder, accentClass }) {
  const [query, setQuery] = useState('')
  const selected = players.find(p => p.id === value)

  const filtered = query.length >= 2
    ? players.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.team || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40)
    : []

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={`Search ${placeholder}...`}
        className="w-full bg-surface2 border border-border px-3 py-2.5
                   text-sm text-heading placeholder-muted font-mono
                   focus:outline-none focus:border-accent transition-colors"
      />

      {query.length > 0 && query.length < 2 && (
        <div className="eyebrow px-1">Type at least 2 characters</div>
      )}

      {query.length >= 2 && (
        <div className="max-h-56 overflow-y-auto border border-border
                        bg-surface2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-muted text-xs font-mono">
              No players found
            </div>
          ) : filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange(p.id); setQuery('') }}
              className={`w-full text-left px-3 py-2 text-sm font-mono
                          transition-colors flex items-center justify-between gap-2
                          border-b border-border last:border-b-0
                          ${value === p.id
                            ? `${accentClass} text-white`
                            : 'text-body hover:bg-surface hover:text-heading'}`}
            >
              <span className="truncate">{p.name}</span>
              <div className="flex items-center gap-2 shrink-0 text-xs opacity-70">
                <span>{p.team}</span>
                <span className="font-semibold">
                  {accentClass.includes('accent')
                    ? `${(p.penalty_skill * 100).toFixed(0)}%`
                    : `${(p.save_skill * 100).toFixed(0)}%`}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-heading font-semibold font-display">{selected.name}</div>
              <div className="eyebrow mt-1">{selected.team}</div>
            </div>
            <span className="eyebrow border border-border px-2 py-1">
              {selected.position}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-mono">
              <span className="text-muted">
                {accentClass.includes('accent') ? 'penalty_skill' : 'save_skill'}
              </span>
              <span className="text-heading font-semibold">
                {accentClass.includes('accent')
                  ? `${(selected.penalty_skill * 100).toFixed(0)}%`
                  : `${(selected.save_skill * 100).toFixed(0)}%`}
              </span>
            </div>
            <div className="bg-surface2 h-1.5">
              <div
                className={`h-1.5 ${accentClass.includes('accent') ? 'bg-accent' : 'bg-amber-500'}`}
                style={{ width: `${(accentClass.includes('accent') ? selected.penalty_skill : selected.save_skill) * 100}%` }}
              />
            </div>
          </div>
          {selected.goals > 0 && (
            <div className="eyebrow mt-3">
              {selected.goals} wc_goals / {selected.appearances} apps
            </div>
          )}
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
    <div className="p-4 md:p-6 space-y-6">

      <div>
        <div className="eyebrow mb-1">Penalty Simulator</div>
        <h1 className="font-display text-2xl font-semibold text-heading">Penalty Simulator</h1>
        <p className="text-body text-sm mt-1">
          OOP probability engine · {playersData?.shooter_count || '—'} shooters · {playersData?.keeper_count || '—'} keepers
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="space-y-4">

          <div className="card p-1 flex gap-1">
            {['single', 'shootout'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); handleReset() }}
                className={`flex-1 py-2 text-sm font-mono transition-colors
                            ${mode === m
                              ? 'bg-accent text-white'
                              : 'text-muted hover:text-heading'}`}
              >
                {m === 'single' ? 'Single Kick' : '5-Kick Shootout'}
              </button>
            ))}
          </div>

          {playersLoading ? (
            <LoadingSpinner text="loading players..." />
          ) : (
            <div className="space-y-4">

              <div className="card p-4">
                <div className="eyebrow mb-3">Shooter</div>
                <PlayerSearch
                  players={shooters}
                  value={shooterId}
                  onChange={(id) => { setShooterId(id); handleReset() }}
                  placeholder="shooter"
                  accentClass="bg-accent"
                />
              </div>

              <div className="card p-4">
                <div className="eyebrow mb-3">Keeper</div>
                <PlayerSearch
                  players={keepers}
                  value={keeperId}
                  onChange={(id) => { setKeeperId(id); handleReset() }}
                  placeholder="keeper"
                  accentClass="bg-amber-600"
                />
              </div>
            </div>
          )}

          <button
            onClick={mode === 'single' ? handleSimulate : handleShootout}
            disabled={!canShoot}
            className="w-full py-3.5 font-display font-medium text-sm
                       transition-colors bg-accent hover:bg-accent2
                       text-white disabled:bg-surface2 disabled:text-muted"
          >
            {animating ? 'Simulating...'
            : mode === 'single' ? 'Take Penalty'
            : 'Run Shootout'}
          </button>

          {error && (
            <div className="border border-red-900 bg-red-950/40 text-red-300
                            text-sm px-4 py-3 font-mono">
              {error}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 space-y-5">

          {!result && !shootout && !animating && (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="eyebrow mb-4">Get Started</div>
              <div className="font-display text-heading font-semibold text-lg mb-2">
                Ready to simulate
              </div>
              <div className="text-body text-sm max-w-xs">
                Search and select a shooter and keeper, then run the simulation.
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-sm">
                {[
                  { label: '1', title: 'Shooter picks', desc: 'Direction + height by style' },
                  { label: '2', title: 'Keeper dives',  desc: 'Based on dive tendency' },
                  { label: '3', title: 'Result',        desc: 'Probabilities decide the outcome' },
                ].map((s, i) => (
                  <div key={i} className="card p-3 text-center">
                    <div className="eyebrow text-accent2 mb-1">{s.label}</div>
                    <div className="text-heading text-xs font-mono font-medium">{s.title}</div>
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
            <div className="card p-12 flex flex-col items-center justify-center">
              <div className="eyebrow mb-4">running shootout</div>
              <div className="text-body text-sm font-mono">5 kicks in progress...</div>
            </div>
          )}

          {shootout && !animating && mode === 'shootout' && (
            <ShootoutHistory
              kicks={shootout.kicks_detail}
              shooter={selectedShooter}
              keeper={selectedKeeper}
            />
          )}

          {(result || shootout) && !animating && (
            <button
              onClick={mode === 'single' ? handleSimulate : handleShootout}
              className="w-full py-2.5 text-sm font-mono
                         bg-surface2 hover:bg-surface text-body
                         transition-colors border border-border"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}