import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#FFC300', '#003566', '#d00000']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-border px-3 py-2 text-xs">
      <span className="text-heading font-semibold">{payload[0].name}: </span>
      <span className="text-body">{payload[0].value}</span>
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
    <div className="card p-5">
      <h3 className="text-heading font-semibold mb-1">Record</h3>
      <p className="text-muted text-xs mb-4">All World Cup matches</p>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={50} outerRadius={75}
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

      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: 'Wins',   value: stats.wins,   color: 'text-accent'  },
          { label: 'Draws',  value: stats.draws,  color: 'text-body'    },
          { label: 'Losses', value: stats.losses, color: 'text-accent2' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className={`text-xl font-bold ${color}`}>{value ?? 0}</div>
            <div className="text-muted text-xs">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-heading font-bold">{stats.goals_for ?? 0}</div>
          <div className="text-muted text-xs">Goals for</div>
        </div>
        <div className="text-center">
          <div className="text-heading font-bold">{stats.goals_against ?? 0}</div>
          <div className="text-muted text-xs">Goals against</div>
        </div>
        <div className="text-center">
          <div className="text-heading font-bold">{stats.win_percentage ?? 0}%</div>
          <div className="text-muted text-xs">Win rate</div>
        </div>
        <div className="text-center">
          <div className="text-heading font-bold">{stats.points ?? 0}</div>
          <div className="text-muted text-xs">Points</div>
        </div>
      </div>
    </div>
  )
}