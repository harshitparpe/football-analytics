import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard'   },
  { to: '/predictions', icon: '🤖', label: 'Predictions'  },
  { to: '/penalty',     icon: '⚽', label: 'Penalty Sim'  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800
                      flex flex-col px-3 py-6 shrink-0">

      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="text-white font-bold text-lg">⚽ FIFA Analytics</div>
        <div className="text-gray-500 text-xs mt-0.5">World Cup Platform</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
               transition-colors
               ${isActive
                 ? 'bg-blue-600 text-white font-medium'
                 : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-800 pt-4 mt-4 px-3">
        <div className="text-sm text-gray-400 mb-2 truncate">
          {user?.username}
        </div>
        <button
          onClick={logout}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}