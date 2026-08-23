import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import { authApi, meApi, tokenStore } from './api'
import { AuthContext } from './auth'
import type { User } from './types'
import LoginPage from './pages/Login/LoginPage'
import MapPage from './pages/Map/MapPage'
import ReportFlowPage from './pages/Report/ReportFlowPage'
import MyReportsPage from './pages/MyReports/MyReportsPage'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(tokenStore.getAccess()))
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
    setIsLoggedIn(false)
  }, [])

  const loadProfile = useCallback(async () => {
    const profile = await meApi.getProfile()
    setUser(profile)
    setIsLoggedIn(true)
  }, [])

  const login = useCallback(async (idToken: string) => {
    await authApi.socialLogin(idToken)
    await loadProfile()
  }, [loadProfile])

  useEffect(() => {
    const initialize = async () => {
      if (!tokenStore.getAccess()) {
        setIsAuthLoading(false)
        return
      }
      try {
        await loadProfile()
      } catch {
        logout()
      } finally {
        setIsAuthLoading(false)
      }
    }
    void initialize()
  }, [loadProfile, logout])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener('safewhale:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('safewhale:unauthorized', handleUnauthorized)
  }, [logout])

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAuthLoading, user, login, logout }}>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/report" element={<ReportFlowPage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
      </Routes>
    </AuthContext.Provider>
  )
}
