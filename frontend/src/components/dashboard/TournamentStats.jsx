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
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                    text-xs shadow-xl">
      <div className="text-gray-400 mb-1">{label} World Cup</div>
      <div className="text-white font-semibold">
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-white font-semibold">Goals Per Match by Tournament</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Average goals scored per match across all World Cups
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Building chart..." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 6]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
            <Bar dataKey="goals" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.goals >= 4 ? '#f59e0b' :
                        entry.goals >= 3 ? '#3b82f6' : '#6b7280'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"/>
          4+ goals
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"/>
          3–4 goals
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-500 inline-block"/>
          Under 3
        </span>
      </div>
    </div>
  )
}