import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard'   },
  { to: '/teams',       label: 'Teams'        },
  { to: '/predictions', label: 'Predictions'  },
  { to: '/penalty',     label: 'Penalty Sim'  },
  { to: '/wc2026',      label: 'WC 2026'      },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-accent font-display font-bold text-lg">⚽</span>
          <span className="font-display font-semibold text-heading text-base tracking-tight">
            FIFA Analytics
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium transition-colors
                 ${isActive
                   ? 'text-accent border-b-2 border-accent'
                   : 'text-body hover:text-heading border-b-2 border-transparent'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout (desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <span className="text-sm text-body">{user?.username}</span>
          <button
            onClick={logout}
            className="text-sm text-body hover:text-accent transition-colors
                       border border-border px-3 py-1.5 hover:border-accent"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="lg:hidden text-heading text-xl"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-surface">
          <nav className="flex flex-col px-4 py-2">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-2 py-3 text-sm font-medium border-b border-border last:border-b-0
                   ${isActive ? 'text-accent' : 'text-body'}`
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="flex items-center justify-between px-2 py-3">
              <span className="text-sm text-body">{user?.username}</span>
              <button
                onClick={logout}
                className="text-sm text-body hover:text-accent transition-colors
                           border border-border px-3 py-1.5"
              >
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}