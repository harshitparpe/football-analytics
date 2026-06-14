import { useEffect, useState } from 'react'

function GoalGrid({ shotDir, shotHeight, keeperDived, scored }) {
  const zones = [
    { dir: 'left',   height: 'high', label: '↖' },
    { dir: 'center', height: 'high', label: '↑' },
    { dir: 'right',  height: 'high', label: '↗' },
    { dir: 'left',   height: 'low',  label: '←' },
    { dir: 'center', height: 'low',  label: '·' },
    { dir: 'right',  height: 'low',  label: '→' },
  ]

  return (
    <div className="my-4">
      <div className="eyebrow text-center mb-2">shot placement</div>
      <div className="border border-border p-2 mx-auto max-w-48 bg-surface2">
        <div className="grid grid-cols-3 gap-1">
          {zones.map((z, i) => {
            const isShot = z.dir === shotDir && z.height === shotHeight
            const isDive = z.dir === keeperDived

            return (
              <div
                key={i}
                className={`
                  h-10 flex items-center justify-center text-lg
                  transition-all duration-300 border
                  ${isShot && scored  ? 'bg-green-900/40 border-green-500' :
                    isShot && !scored ? 'bg-red-900/40   border-red-500'   :
                    isDive            ? 'bg-amber-900/20 border-amber-700/50' :
                                        'bg-surface border-border'}
                `}
              >
                {isShot ? (scored ? '⚽' : '✗') : isDive ? '🧤' : ''}
              </div>
            )
          })}
        </div>
      </div>
      <div className="eyebrow text-center mb-2">Shot placement</div>
        {/* <span>⚽ Shot</span>
        <span>🧤 Keeper dive</span>
        <div className="eyebrow mb-1">Score chance</div>
        <div className="eyebrow mb-1">Save chance</div>
        <div className="eyebrow">Taking the penalty...</div> */}
    </div>
  )
}

export default function PenaltyResult({ result, animating }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (result) {
      setVisible(false)
      const t = setTimeout(() => setVisible(true), 300)
      return () => clearTimeout(t)
    }
  }, [result])

  if (!result && !animating) return null

  if (animating) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center min-h-48">
        <div className="text-5xl animate-bounce mb-4">⚽</div>
        <div className="eyebrow">taking the penalty...</div>
      </div>
    )
  }

  const scored = result.scored
  const isMiss = !scored && (
    result.reason.includes('bar') || result.reason.includes('wide') ||
    result.reason.includes('over') || result.reason.includes('scuffs') ||
    result.reason.includes('Nerves')
  )

  const color    = scored ? 'text-green-400' : isMiss ? 'text-red-400' : 'text-amber-400'
  const borderC  = scored ? 'border-green-900/50' : isMiss ? 'border-red-900/50' : 'border-amber-900/50'
  const headline = scored ? 'GOAL' : isMiss ? 'MISSED' : 'SAVED'

  return (
    <div className={`card border ${borderC} p-5 transition-all duration-500
                     ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      <div className="text-center mb-2">
        <div className="text-5xl mb-2">{scored ? '🥅' : isMiss ? '😬' : '🧤'}</div>
        <div className={`font-display text-3xl font-bold tracking-widest ${color}`}>
          {headline}
        </div>
      </div>

      <div className="text-body text-sm text-center italic my-4 px-4 leading-relaxed font-mono">
        "{result.reason}"
      </div>

      <GoalGrid
        shotDir={result.shot_direction}
        shotHeight={result.shot_height}
        keeperDived={result.keeper_dived}
        scored={scored}
      />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-surface2 border border-border p-3 text-center">
          <div className="eyebrow mb-1">score_chance</div>
          <div className="text-heading font-display font-bold text-lg">
            {(result.score_prob * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-surface2 border border-border p-3 text-center">
          <div className="eyebrow mb-1">save_chance</div>
          <div className="text-heading font-display font-bold text-lg">
            {(result.save_prob * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  )
}