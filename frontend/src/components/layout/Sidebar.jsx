import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard'   },
  { to: '/teams',       icon: '🌍', label: 'Teams'        },
  { to: '/predictions', icon: '🤖', label: 'Predictions'  },
  { to: '/penalty',     icon: '⚽', label: 'Penalty Sim'  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`min-h-screen bg-gray-900 border-r border-gray-800
                       flex flex-col transition-all duration-200
                       ${collapsed ? 'w-14' : 'w-56'} shrink-0`}>

      {/* Logo + collapse toggle */}
      <div className="px-3 py-5 flex items-center justify-between border-b
                      border-gray-800">
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm">⚽ FIFA Analytics</div>
            <div className="text-gray-500 text-xs mt-0.5">World Cup Platform</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-500 hover:text-white p-1 rounded-lg
                     hover:bg-gray-800 transition-colors ml-auto"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm
               transition-colors
               ${isActive
                 ? 'bg-blue-600 text-white font-medium'
                 : 'text-gray-400 hover:text-white hover:bg-gray-800'}
               ${collapsed ? 'justify-center' : ''}`
            }
          >
            <span className="text-base shrink-0">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 p-3">
        {!collapsed && (
          <div className="text-xs text-gray-500 mb-2 truncate px-1">
            {user?.username}
          </div>
        )}
        <button
          onClick={logout}
          title="Sign out"
          className={`text-xs text-gray-600 hover:text-red-400 transition-colors
                      flex items-center gap-2
                      ${collapsed ? 'justify-center w-full' : ''}`}
        >
          <span>↩</span>
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}