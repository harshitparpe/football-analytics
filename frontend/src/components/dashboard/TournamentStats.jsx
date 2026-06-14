import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { teamsAPI } from '../../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import LoadingSpinner from '../LoadingSpinner'

const YEARS = [1930,1934,1938,1950,1954,1958,1962,1966,1970,
               1974,1978,1982,1986,1990,1994,1998,2002,2006,2010,2014]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-border px-3 py-2 text-xs shadow-xl">
      <div className="text-muted mb-1">{label} World Cup</div>
      <div className="text-heading font-semibold">
        {payload[0].value} avg goals/match
      </div>
    </div>
  )
}

export default function TournamentStats() {
  const [chartData, setChartData] = useState([])
  const [fetched, setFetched]     = useState(false)

  const { loading } = useFetch(async () => {
    if (fetched) return
    const results = await Promise.all(
      YEARS.map(y => teamsAPI.getTournamentAverages(y)
        .then(r => ({ year: y, goals: r.data.avg_goals_per_match }))
        .catch(() => ({ year: y, goals: 0 }))
      )
    )
    setChartData(results.filter(d => d.goals > 0))
    setFetched(true)
  }, [])

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-heading font-semibold">Goals Per Match by Tournament</h2>
        <p className="text-xs text-muted mt-0.5">
          Average goals scored per match across all World Cups
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Building chart..." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#003566" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 6]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FFC30010' }} />
            <Bar dataKey="goals" radius={[0, 0, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.goals >= 8 ? '#FFC300' :
                        entry.goals >= 6 ? '#d00000' : '#003566 '}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-4 mt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-accent inline-block"/>
          8+ goals
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-accent2 inline-block"/>
          6–8 goals
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-border inline-block"/>
          Under 6 goals
        </span>
      </div>
    </div>
  )
}