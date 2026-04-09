import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import IDE from './pages/IDE'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('devflow_token'))

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const t = p.get('token'), e = p.get('error')
    if (t) { localStorage.setItem('devflow_token', t); setToken(t); window.history.replaceState({}, '', '/') }
    if (e) { console.error('Auth error:', e); window.history.replaceState({}, '', '/') }
  }, [])

  const logout = () => { localStorage.removeItem('devflow_token'); localStorage.removeItem('devflow_repo'); setToken(null) }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"    element={token ? <Navigate to="/ide" replace/> : <Login/>}/>
        <Route path="/ide" element={token ? <IDE token={token} onLogout={logout}/> : <Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}
