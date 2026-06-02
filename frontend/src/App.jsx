import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import Predictions from './pages/Predictions'
import Penalty    from './pages/Penalty'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — all wrapped in Layout */}
          <Route path="/dashboard" element={
            <Layout><Dashboard /></Layout>
          } />
          <Route path="/predictions" element={
            <Layout><Predictions /></Layout>
          } />
          <Route path="/penalty" element={
            <Layout><Penalty /></Layout>
          } />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}