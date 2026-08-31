import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import { authApi, meApi, tokenStore } from './api'
import type { PrincipalType } from './api/http'
import { AuthContext, useAuth } from './auth'
import type { User } from './types'
import LoginPage from './pages/Login/LoginPage'
import MapPage from './pages/Map/MapPage'
import ReportFlowPage from './pages/Report/ReportFlowPage'
import MyReportsPage from './pages/MyReports/MyReportsPage'

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
        <Route path="/admin" element={<AdminAccessPage />} />
      </Routes>
    </AuthContext.Provider>
  )
}

function AdminAccessPage() {
  const { isLoggedIn, principalType, logout } = useAuth()
  if (!isLoggedIn || principalType !== "ADMIN") return <Navigate to="/login" replace />
  return (
    <main className="min-h-dvh px-page flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-text-primary">관리자 계정으로 로그인되었습니다</h1>
      <p className="mt-3 text-text-secondary">이 계정은 관리자 API에 접근할 수 있습니다. 관리자 대시보드 UI는 별도 구현이 필요합니다.</p>
      <button className="mt-6 text-sogang-500 underline" onClick={logout}>로그아웃</button>
    </main>
  )
}
