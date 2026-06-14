import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Navbar from './Navbar'

export default function Layout({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-muted text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}