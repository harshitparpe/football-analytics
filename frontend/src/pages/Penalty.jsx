import { useState } from 'react'
import { penaltyAPI } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import PlayerCard      from '../components/penalty/PlayerCard'
import PenaltyResult   from '../components/penalty/PenaltyResult'
import ShootoutHistory from '../components/penalty/ShootoutHistory'
import LoadingSpinner  from '../components/LoadingSpinner'

// Inline searchable dropdown — simpler than TeamSelector for player objects
function PlayerDropdown({ players, value, onChange, placeholder, color }) {
  const [query, setQuery] = useState('')
  const selected = players.find(p => p.id === value)

  const filtered = players
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) ||
                 (p.team || '').toLowerCase().includes(query.toLowerCase()))
    .slice(0, 50)

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={`Search ${placeholder}...`}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                   text-sm text-white placeholder-gray-500 focus:outline-none
                   focus:border-blue-500"
      />
      <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg
                      bg-gray-800 border border-gray-700 p-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-gray-500 text-xs">No players found</div>
        ) : filtered.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm
                        transition-colors flex items-center justify-between gap-2
                        ${value === p.id
                          ? (color === 'blue' ? 'bg-blue-600 text-white'
                                              : 'bg-amber-600 text-white')
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <span className="truncate font-medium">{p.name}</span>
            <div className="flex items-center gap-2 shrink-0 text-xs opacity-70">
              <span>{p.team}</span>
              <span className="font-bold">
                {color === 'blue'
                  ? `${(p.penalty_skill * 100).toFixed(0)}%`
                  : `${(p.save_skill * 100).toFixed(0)}%`}
              </span>
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="text-xs text-gray-500 px-1">
          Selected: <span className="text-white">{selected.name}</span>
          {' · '}{selected.team}
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
    useFetch(() => penaltyAPI.getPlayers({ shooters: 150, keepers: 100 }))

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
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Penalty Simulator</h1>
        <p className="text-gray-500 text-sm mt-1">
          Probabilistic OOP engine · Shooter vs Keeper · Direction matters
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left — controls */}
        <div className="space-y-4">

          {/* Mode toggle */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-1 flex gap-1">
            {['single', 'shootout'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); handleReset() }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium
                            transition-colors
                            ${mode === m
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 hover:text-gray-300'}`}
              >
                {m === 'single' ? '⚽ Single' : '🔁 Shootout'}
              </button>
            ))}
          </div>

          {playersLoading ? (
            <LoadingSpinner text="Loading players..." />
          ) : (
            <div className="space-y-4">

              {/* Shooter selector */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  👟 Shooter
                  <span className="text-gray-600 ml-2 normal-case">
                    ({shooters.length} available)
                  </span>
                </div>
                <PlayerDropdown
                  players={shooters}
                  value={shooterId}
                  onChange={(id) => { setShooterId(id); handleReset() }}
                  placeholder="shooter"
                  color="blue"
                />
                {selectedShooter && (
                  <div className="mt-3">
                    <PlayerCard player={selectedShooter} role="shooter" />
                  </div>
                )}
              </div>

              {/* Keeper selector */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  🧤 Keeper
                  <span className="text-gray-600 ml-2 normal-case">
                    ({keepers.length} available)
                  </span>
                </div>
                <PlayerDropdown
                  players={keepers}
                  value={keeperId}
                  onChange={(id) => { setKeeperId(id); handleReset() }}
                  placeholder="keeper"
                  color="amber"
                />
                {selectedKeeper && (
                  <div className="mt-3">
                    <PlayerCard player={selectedKeeper} role="keeper" />
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={mode === 'single' ? handleSimulate : handleShootout}
            disabled={!canShoot}
            className="w-full py-3.5 rounded-xl font-semibold text-sm
                       transition-colors bg-blue-600 hover:bg-blue-500
                       text-white disabled:bg-gray-800 disabled:text-gray-600"
          >
            {animating ? 'Simulating...'
              : mode === 'single' ? '⚽ Take Penalty'
              : '🔁 Run 5-Kick Shootout'}
          </button>

          {error && (
            <div className="text-red-400 text-sm bg-red-950/50 border
                            border-red-900 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* Right — result */}
        <div className="xl:col-span-2 space-y-5">

          {!result && !shootout && !animating && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12
                            flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">⚽</div>
              <div className="text-white font-semibold text-lg mb-2">
                Ready to simulate
              </div>
              <div className="text-gray-500 text-sm max-w-xs">
                Search and select a shooter and keeper, then click Take Penalty.
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm">
                {[
                  { icon: '👟', title: 'Shooter picks', desc: 'Direction + height by style' },
                  { icon: '🧤', title: 'Keeper dives',  desc: 'Based on dive tendency' },
                  { icon: '🎲', title: 'Outcome',       desc: 'Probabilities resolve it' },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-white text-xs font-medium">{s.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(result || animating) && mode === 'single' && (
            <PenaltyResult result={result} animating={animating} />
          )}

          {animating && mode === 'shootout' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12
                            flex flex-col items-center justify-center">
              <div className="text-5xl animate-bounce mb-4">⚽</div>
              <div className="text-gray-400 text-sm">Running 5-kick shootout...</div>
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
              className="w-full py-2.5 rounded-xl text-sm font-medium
                         bg-gray-800 hover:bg-gray-700 text-gray-300
                         transition-colors border border-gray-700"
            >
              🔄 Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}