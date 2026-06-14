import { useFetch } from '../../hooks/useFetch'
import { predictAPI } from '../../api/client'

export default function ModelInfo() {
  const { data, loading } = useFetch(() => predictAPI.getModelInfo())

  if (loading) return (
    <div className="animate-pulse space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 bg-surface2" />
      ))}
    </div>
  )

  if (!data) return null

  const accuracy = (data.test_accuracy * 100).toFixed(1)
  const cv       = (data.cv_mean * 100).toFixed(1)
  const cvStd    = (data.cv_std * 100).toFixed(1)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted">Test Accuracy</span>
          <span className="text-heading font-semibold">{accuracy}%</span>
        </div>
        <div className="bg-surface2 h-2">
          <div className="bg-accent h-2 transition-all" style={{ width: `${accuracy}%` }} />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted">CV Score (5-fold)</span>
          <span className="text-heading font-semibold">{cv}% ± {cvStd}%</span>
        </div>
        <div className="bg-surface2 h-2">
          <div className="bg-accent2 h-2 transition-all" style={{ width: `${cv}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div className="bg-surface2 border border-border p-2.5">
          <div className="text-muted">Model</div>
          <div className="text-heading font-medium mt-0.5">Random Forest</div>
        </div>
        <div className="bg-surface2 border border-border p-2.5">
          <div className="text-muted">Version</div>
          <div className="text-heading font-medium mt-0.5">{data.version}</div>
        </div>
        <div className="bg-surface2 border border-border p-2.5">
          <div className="text-muted">Estimators</div>
          <div className="text-heading font-medium mt-0.5">{data.n_estimators}</div>
        </div>
        <div className="bg-surface2 border border-border p-2.5">
          <div className="text-muted">Features</div>
          <div className="text-heading font-medium mt-0.5">{data.features?.length}</div>
        </div>
      </div>

      <div>
        <div className="text-xs text-muted mb-2 uppercase tracking-wider">Features used</div>
        <div className="flex flex-wrap gap-1.5">
          {data.features?.map(f => (
            <span key={f} className="text-xs bg-surface2 text-body px-2 py-0.5 border border-border">
              {f.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}