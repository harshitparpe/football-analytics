import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2500)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: 'bg-green-900 border-green-700 text-green-300',
    error:   'bg-red-900   border-red-700   text-red-300',
    info:    'bg-blue-900  border-blue-700  text-blue-300',
  }

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm
      shadow-2xl transition-all duration-300
      ${colors[type]}
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
    `}>
      {message}
    </div>
  )
}