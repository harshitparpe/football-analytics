import { useState, useRef, useEffect } from 'react'

export default function TeamSelector({ teams, value, onChange, placeholder, disabled }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  const selected = teams.find(t => t.id === value)

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 12)

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
                    bg-surface2 border transition-colors text-sm
                    ${open ? 'border-accent' : 'border-border'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent/50 cursor-pointer'}`}
      >
        <span className={selected ? 'text-heading font-medium' : 'text-muted'}>
          {selected ? selected.name : placeholder}
        </span>
        <span className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-surface2 border border-border shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-surface border border-border px-3 py-1.5
                         text-sm text-heading placeholder-muted
                         focus:outline-none focus:border-accent"
            />
          </div>
          <div className="max-h-52 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-muted text-sm">No teams found</div>
            ) : filtered.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onChange(t.id); setOpen(false); setQuery('') }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                            flex items-center justify-between
                            ${t.id === value
                              ? 'bg-accent text-bg'
                              : 'text-body hover:bg-surface'}`}
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