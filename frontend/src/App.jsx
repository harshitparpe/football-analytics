import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout      from './components/layout/Layout'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import Predictions from './pages/Predictions'
import Penalty     from './pages/Penalty'
import Teams       from './pages/Teams'
import WC2026 from './pages/WC2026'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/predictions" element={<Layout><Predictions /></Layout>} />
          <Route path="/penalty"  element={<Layout><Penalty /></Layout>} />
          <Route path="/teams"    element={<Layout><Teams /></Layout>} />     {/* ← add */}
          <Route path="/teams/:id" element={<Layout><Teams /></Layout>} />    {/* ← add */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/wc2026" element={<Layout><WC2026 /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}