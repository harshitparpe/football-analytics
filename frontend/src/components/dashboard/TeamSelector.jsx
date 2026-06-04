import { useState, useRef, useEffect } from 'react'

export default function TeamSelector({ teams, value, onChange, placeholder, disabled }) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const ref                 = useRef(null)

  const selected = teams.find(t => t.id === value)

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 12)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3
                    bg-gray-800 border rounded-xl text-sm transition-colors
                    ${open ? 'border-blue-500' : 'border-gray-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600 cursor-pointer'}`}
      >
        <span className={selected ? 'text-white font-medium' : 'text-gray-500'}>
          {selected ? selected.name : placeholder}
        </span>
        <span className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700
                        rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg
                         px-3 py-1.5 text-sm text-white placeholder-gray-500
                         focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">No teams found</div>
            ) : filtered.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onChange(t.id); setOpen(false); setQuery('') }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                            flex items-center justify-between
                            ${t.id === value
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'}`}
              >
                <span>{t.name}</span>
                <span className="text-xs opacity-60">{t.confederation}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}