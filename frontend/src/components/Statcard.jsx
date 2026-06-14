export default function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card p-5 hover:border-accent/40 transition-colors">
      <div className="eyebrow mb-3">{icon}</div>
      <div className="font-display text-2xl font-semibold text-heading">{value}</div>
      <div className="text-sm font-medium text-body mt-0.5">{label}</div>
      {sub && <div className="eyebrow mt-2">{sub}</div>}
    </div>
  )
}