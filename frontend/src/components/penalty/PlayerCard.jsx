export default function PlayerCard({ player, role, empty }) {
  if (empty || !player) {
    return (
      <div className="border-2 border-dashed border-gray-700 rounded-xl p-5
                      flex flex-col items-center justify-center min-h-32 text-center">
        <div className="text-3xl mb-2">{role === 'shooter' ? '👟' : '🧤'}</div>
        <div className="text-gray-600 text-sm">
          Select a {role === 'shooter' ? 'shooter' : 'keeper'}
        </div>
      </div>
    )
  }

  const skillValue  = role === 'shooter' ? player.penalty_skill : player.save_skill
  const skillLabel  = role === 'shooter' ? 'Penalty Skill' : 'Save Skill'
  const skillColor  = skillValue >= 0.8 ? 'bg-green-500' :
                      skillValue >= 0.6 ? 'bg-blue-500' : 'bg-gray-500'

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white font-semibold">{player.name}</div>
          <div className="text-gray-400 text-xs mt-0.5">{player.team}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${role === 'shooter'
            ? 'bg-blue-900 text-blue-300'
            : 'bg-amber-900 text-amber-300'}`}>
          {player.position}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">{skillLabel}</span>
            <span className="text-white font-medium">
              {(skillValue * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${skillColor}`}
              style={{ width: `${skillValue * 100}%` }}
            />
          </div>
        </div>
        {player.goals > 0 && (
          <div className="text-xs text-gray-500">
            {player.goals} WC goals · {player.appearances} apps
          </div>
        )}
      </div>
    </div>
  )
}