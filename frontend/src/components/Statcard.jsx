export default function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-950  border-blue-800  text-blue-400',
    green:  'bg-green-950 border-green-800 text-green-400',
    amber:  'bg-amber-950 border-amber-800 text-amber-400',
    purple: 'bg-purple-950 border-purple-800 text-purple-400',
  }
  return (
    <div className={`${colors[color]} border rounded-xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}