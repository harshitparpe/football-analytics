import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface2 border border-border px-3 py-2 text-xs shadow-xl">
      <div className="text-heading font-semibold">{d.name}</div>
      <div className="text-muted mt-0.5">{d.pct} probability</div>
    </div>
  )
}

export default function ProbabilityChart({ result }) {
  if (!result) return null

  const data = [
    { name: result.team_a.name, prob: +(result.team_a.win_prob * 100).toFixed(1), pct: result.team_a.win_prob_pct, color: '#FFC300' },
    { name: 'Draw',              prob: +(result.draw.prob * 100).toFixed(1),       pct: result.draw.prob_pct,        color: '#003566' },
    { name: result.team_b.name, prob: +(result.team_b.win_prob * 100).toFixed(1), pct: result.team_b.win_prob_pct, color: '#FFD60A' },
  ]

  return (
    <div>
      <div className="text-center mb-5">
        <span className="text-xs text-muted uppercase tracking-wider">Predicted winner</span>
        <div className="text-2xl font-bold text-heading mt-1">{result.favourite}</div>
        <div className="text-sm text-body mt-0.5">
          Model accuracy: {(result.model_accuracy * 100).toFixed(1)}%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 16, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#003566" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FFC30008' }} />
          <Bar dataKey="prob" radius={[0, 0, 0, 0]} maxBarSize={80}>
            <LabelList dataKey="pct" position="top" style={{ fill: '#e8f0fe', fontSize: 12, fontWeight: 600 }} />
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}