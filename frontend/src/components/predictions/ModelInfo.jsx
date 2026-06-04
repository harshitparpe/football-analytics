import { useFetch } from '../../hooks/useFetch'
import { predictAPI } from '../../api/client'

export default function ModelInfo() {
  const { data, loading } = useFetch(() => predictAPI.getModelInfo())

  if (loading) return (
    <div className="animate-pulse space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-800 rounded" />
      ))}
    </div>
  )

  if (!data) return null

  const accuracy = (data.test_accuracy * 100).toFixed(1)
  const cv       = (data.cv_mean * 100).toFixed(1)
  const cvStd    = (data.cv_std * 100).toFixed(1)

  return (
    <div className="space-y-4">
      {/* Accuracy meter */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">Test Accuracy</span>
          <span className="text-white font-semibold">{accuracy}%</span>
        </div>
        <div className="bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">CV Score (5-fold)</span>
          <span className="text-white font-semibold">{cv}% ± {cvStd}%</span>
        </div>
        <div className="bg-gray-800 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${cv}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div className="bg-gray-800 rounded-lg p-2.5">
          <div className="text-gray-500">Model</div>
          <div className="text-white font-medium mt-0.5">Random Forest</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2.5">
          <div className="text-gray-500">Version</div>
          <div className="text-white font-medium mt-0.5">{data.version}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2.5">
          <div className="text-gray-500">Estimators</div>
          <div className="text-white font-medium mt-0.5">{data.n_estimators}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2.5">
          <div className="text-gray-500">Features</div>
          <div className="text-white font-medium mt-0.5">{data.features?.length}</div>
        </div>
      </div>

      {/* Feature list */}
      <div>
        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider">
          Features used
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.features?.map(f => (
            <span key={f}
              className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {f.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}