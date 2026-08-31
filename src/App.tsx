import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import { authApi, meApi, tokenStore } from './api'
import type { PrincipalType } from './api/http'
import { AuthContext } from './auth'
import type { User } from './types'
import LoginPage from './pages/Login/LoginPage'
import MapPage from './pages/Map/MapPage'
import ReportFlowPage from './pages/Report/ReportFlowPage'
import MyReportsPage from './pages/MyReports/MyReportsPage'
import AdminGuard from './pages/Admin/AdminGuard'
import AdminDashboardPage from './pages/Admin/AdminDashboardPage'
import AdminReportDetailPage from './pages/Admin/AdminReportDetailPage'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(tokenStore.getAccess()))
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [principalType, setPrincipalType] = useState<PrincipalType | null>(() => tokenStore.getPrincipalType())

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
    setPrincipalType(null)
    setIsLoggedIn(false)
  }, [])

  const loadProfile = useCallback(async () => {
    const profile = await meApi.getProfile()
    setUser(profile)
    setIsLoggedIn(true)
  }, [])

  const login = useCallback(async (idToken: string) => {
    const result = await authApi.socialLogin(idToken)
    setPrincipalType(result.principalType)
    if (result.principalType === "USER") await loadProfile()
    else setIsLoggedIn(true)
    return result.principalType
  }, [loadProfile])

  useEffect(() => {
    const initialize = async () => {
      if (!tokenStore.getAccess()) {
        setIsAuthLoading(false)
        return
      }
      try {
        const type = tokenStore.getPrincipalType()
        setPrincipalType(type)
        if (type === "ADMIN") setIsLoggedIn(true)
        else await loadProfile()
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
    <AuthContext.Provider value={{ isLoggedIn, isAuthLoading, user, principalType, login, logout }}>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/report" element={<ReportFlowPage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
        <Route path="/admin" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
        <Route path="/admin/reports/:id" element={<AdminGuard><AdminReportDetailPage /></AdminGuard>} />
      </Routes>
    </AuthContext.Provider>
  )
}
