import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-white font-semibold">{d.name}</div>
      <div className="text-gray-400 mt-0.5">{d.pct} probability</div>
    </div>
  )
}

export default function ProbabilityChart({ result }) {
  if (!result) return null

  const data = [
    {
      name: result.team_a.name,
      prob: +(result.team_a.win_prob * 100).toFixed(1),
      pct:  result.team_a.win_prob_pct,
      color:'#3b82f6',
    },
    {
      name: 'Draw',
      prob: +(result.draw.prob * 100).toFixed(1),
      pct:  result.draw.prob_pct,
      color:'#6b7280',
    },
    {
      name: result.team_b.name,
      prob: +(result.team_b.win_prob * 100).toFixed(1),
      pct:  result.team_b.win_prob_pct,
      color:'#f59e0b',
    },
  ]

  const favourite = result.favourite

  return (
    <div>
      {/* Favourite banner */}
      <div className="text-center mb-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Predicted winner</span>
        <div className="text-2xl font-bold text-white mt-1">{favourite}</div>
        <div className="text-sm text-gray-400 mt-0.5">
          Model accuracy: {(result.model_accuracy * 100).toFixed(1)}%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 16, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
          <Bar dataKey="prob" radius={[6, 6, 0, 0]} maxBarSize={80}>
            <LabelList
              dataKey="pct"
              position="top"
              style={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 600 }}
            />
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}