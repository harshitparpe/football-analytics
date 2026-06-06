import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#6b7280', '#f59e0b']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <span className="text-white font-semibold">{payload[0].name}: </span>
      <span className="text-gray-300">{payload[0].value}</span>
    </div>
  )
}

export default function WinDonut({ stats }) {
  if (!stats) return null

  const data = [
    { name: 'Wins',   value: stats.wins   || 0 },
    { name: 'Draws',  value: stats.draws  || 0 },
    { name: 'Losses', value: stats.losses || 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-1">Record</h3>
      <p className="text-gray-500 text-xs mb-4">All World Cup matches</p>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: 'Wins',   value: stats.wins,   color: 'text-blue-400'  },
          { label: 'Draws',  value: stats.draws,  color: 'text-gray-400'  },
          { label: 'Losses', value: stats.losses, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className={`text-xl font-bold ${color}`}>{value ?? 0}</div>
            <div className="text-gray-600 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-800">
        <div className="text-center">
          <div className="text-white font-bold">{stats.goals_for ?? 0}</div>
          <div className="text-gray-600 text-xs">Goals for</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold">{stats.goals_against ?? 0}</div>
          <div className="text-gray-600 text-xs">Goals against</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold">{stats.win_percentage ?? 0}%</div>
          <div className="text-gray-600 text-xs">Win rate</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold">{stats.points ?? 0}</div>
          <div className="text-gray-600 text-xs">Points</div>
        </div>
      </div>
    </div>
  )
}