import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard',   icon: '◈', label: 'Dashboard'   },
  { to: '/teams',       icon: '◎', label: 'Teams'        },
  { to: '/predictions', icon: '▣', label: 'Predictions'  },
  { to: '/penalty',     icon: '◉', label: 'Penalty Sim'  },
  { to: '/wc2026',      icon: '▦', label: 'WC 2026'      },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`min-h-screen bg-surface border-r border-border
                       flex flex-col transition-all duration-200
                       ${collapsed ? 'w-14' : 'w-60'} shrink-0`}>

      <div className="px-4 py-5 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <div>
            <div className="font-display font-semibold text-heading text-sm tracking-tight">
              FIFA_ANALYTICS
            </div>
            <div className="eyebrow mt-1">v1.0 / world cup platform</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-muted hover:text-accent transition-colors ml-auto font-mono text-xs"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-mono
               transition-colors border-l-2
               ${isActive
                 ? 'bg-surface2 text-accent2 border-accent'
                 : 'text-body hover:text-heading hover:bg-surface2 border-transparent'}
               ${collapsed ? 'justify-center' : ''}`
            }
          >
            <span className="text-base shrink-0">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && (
          <div className="eyebrow mb-2 truncate px-1">
            user / {user?.username}
          </div>
        )}
        <button
          onClick={logout}
          title="Sign out"
          className={`text-xs font-mono text-muted hover:text-red-400 transition-colors
                      flex items-center gap-2
                      ${collapsed ? 'justify-center w-full' : ''}`}
        >
          <span>×</span>
          {!collapsed && 'sign_out()'}
        </button>
      </div>
    </aside>
  )
}