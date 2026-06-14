import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-border px-3 py-2 text-xs shadow-xl">
      <div className="text-muted mb-1">{label} World Cup</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function GoalsChart({ matches, teamName }) {
  const chartData = useMemo(() => {
    if (!matches?.length || !teamName) return []

    const byYear = {}
    matches.forEach(m => {
      if (m.score_a === null) return
      const year = m.year
      if (!byYear[year]) byYear[year] = { year, scored: 0, conceded: 0, played: 0 }

      const isTeamA = m.team_a_name === teamName
      byYear[year].scored   += isTeamA ? (m.score_a || 0) : (m.score_b || 0)
      byYear[year].conceded += isTeamA ? (m.score_b || 0) : (m.score_a || 0)
      byYear[year].played   += 1
    })

    return Object.values(byYear).sort((a, b) => a.year - b.year)
  }, [matches, teamName])

  if (!chartData.length) {
    return (
      <div className="card p-5">
        <h3 className="text-heading font-semibold mb-4">Goals Per Tournament</h3>
        <div className="text-muted text-sm text-center py-8">
          No match data available
        </div>
      </div>
    )
  }

  const avgScored = (chartData.reduce((s, d) => s + d.scored, 0) / chartData.length).toFixed(1)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading font-semibold">Goals Per Tournament</h3>
          <p className="text-muted text-xs mt-0.5">
            Avg scored: {avgScored} per tournament
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-accent inline-block" />
            Scored
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-accent2 inline-block" />
            Conceded
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#003566" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={parseFloat(avgScored)} stroke="#FFC30040" strokeDasharray="4 4" />
          <Line
            type="monotone" dataKey="scored" name="Scored"
            stroke="#FFC300" strokeWidth={2}
            dot={{ fill: '#FFC300', r: 3 }} activeDot={{ r: 5 }}
          />
          <Line
            type="monotone" dataKey="conceded" name="Conceded"
            stroke="#d00000" strokeWidth={2}
            dot={{ fill: '#d00000', r: 3 }} activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}