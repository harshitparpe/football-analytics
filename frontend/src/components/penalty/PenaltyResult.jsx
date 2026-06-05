import { useEffect, useState } from 'react'

const GOAL_COLOR = 'text-green-400'
const SAVE_COLOR = 'text-amber-400'
const MISS_COLOR = 'text-red-400'

// 3x2 goal grid — highlights the shot zone
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
      <div className="text-xs text-gray-600 text-center mb-2 uppercase tracking-wider">
        Shot placement
      </div>
      {/* Goal frame */}
      <div className="border-2 border-gray-600 rounded-lg p-2 mx-auto max-w-48
                      bg-gray-900">
        <div className="grid grid-cols-3 gap-1">
          {zones.map((z, i) => {
            const isShot   = z.dir === shotDir   && z.height === shotHeight
            const isDive   = z.dir === keeperDived
            const topRow   = z.height === 'high'

            return (
              <div
                key={i}
                className={`
                  h-10 rounded flex items-center justify-center text-lg
                  transition-all duration-300
                  ${isShot && scored  ? 'bg-green-800 border-2 border-green-500' :
                    isShot && !scored ? 'bg-red-900   border-2 border-red-600'   :
                    isDive            ? 'bg-amber-900/40 border border-amber-700/50' :
                                        'bg-gray-800 border border-gray-700'}
                `}
              >
                {isShot ? (scored ? '⚽' : '✗') : isDive ? '🧤' : ''}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1.5 px-1">
        <span>⚽ shot</span>
        <span>🧤 keeper dive</span>
      </div>
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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8
                      flex flex-col items-center justify-center min-h-48">
        <div className="text-5xl animate-bounce mb-4">⚽</div>
        <div className="text-gray-400 text-sm">Taking the penalty...</div>
      </div>
    )
  }

  const scored   = result.scored
  const color    = scored ? GOAL_COLOR : result.reason.includes('bar') ||
                   result.reason.includes('wide') || result.reason.includes('over') ||
                   result.reason.includes('scuffs') || result.reason.includes('Nerves')
                   ? MISS_COLOR : SAVE_COLOR

  const icon     = scored ? '🥅' : color === MISS_COLOR ? '😬' : '🧤'
  const headline = scored ? 'GOAL!' : color === MISS_COLOR ? 'MISSED!' : 'SAVED!'

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-all duration-500
                     ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                     ${scored
                       ? 'border-green-800'
                       : color === MISS_COLOR
                         ? 'border-red-800'
                         : 'border-amber-800'}`}>

      {/* Headline */}
      <div className="text-center mb-2">
        <div className="text-5xl mb-2">{icon}</div>
        <div className={`text-3xl font-black tracking-widest ${color}`}>
          {headline}
        </div>
      </div>

      {/* Narrative */}
      <div className="text-gray-300 text-sm text-center italic my-4 px-4 leading-relaxed">
        "{result.reason}"
      </div>

      {/* Goal grid */}
      <GoalGrid
        shotDir    ={result.shot_direction}
        shotHeight ={result.shot_height}
        keeperDived={result.keeper_dived}
        scored     ={scored}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Score chance</div>
          <div className="text-white font-bold text-lg">
            {(result.score_prob * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Save chance</div>
          <div className="text-white font-bold text-lg">
            {(result.save_prob * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  )
}