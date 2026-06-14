import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ username: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
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
                    <div className="eyebrow mb-6">Create account</div>

          {error && (
            <div className="border border-red-900 bg-red-950/40 text-red-300
                            px-4 py-3 mb-5 text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow mb-2 block">Username</label>
              <input
                type="text" name="username" value={form.username}
                onChange={handleChange} required placeholder="your_username"
                className="w-full bg-surface2 border border-border px-4 py-2.5
                           text-sm text-heading placeholder-muted font-mono
                           focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="eyebrow mb-2 block">Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} required placeholder="you@example.com"
                className="w-full bg-surface2 border border-border px-4 py-2.5
                           text-sm text-heading placeholder-muted font-mono
                           focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="eyebrow mb-2 block">Password</label>
              <input
                type="password" name="password" value={form.password}
                onChange={handleChange} required placeholder="min. 6 characters"
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
              {loading ? 'Creating account...' : 'Create account'} 
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6 font-mono">
            have an account? <Link to="/login">Sign in</Link> 
          </p>
        </div>
      </div>
    </div>
  )
}