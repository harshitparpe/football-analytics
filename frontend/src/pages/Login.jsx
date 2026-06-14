import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="eyebrow mb-2">FIFA World Cup Intelligence Platform</div>
          <h1 className="font-display text-3xl font-semibold text-heading tracking-tight">
            FOOTBALL ANALYTICS
          </h1>
        </div>

        <div className="card p-8">
          <div className="eyebrow mb-6">Sign in</div>

          {error && (
            <div className="border border-red-900 bg-red-950/40 text-red-300
                            px-4 py-3 mb-5 text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow mb-2 block">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full bg-surface2 border border-border px-4 py-2.5
                           text-sm text-heading placeholder-muted font-mono
                           focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="eyebrow mb-2 block">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full bg-surface2 border border-border px-4 py-2.5
                           text-sm text-heading placeholder-muted font-mono
                           focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent2 disabled:bg-surface2
           disabled:text-muted text-bg font-display font-semibold
           py-2.5 mt-2 transition-colors text-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'} 
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6 font-mono">
            No account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}