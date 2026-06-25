import { Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useState, useCallback } from 'react'
import LoginPage from './pages/Login/LoginPage'
import SchoolChangePage from './pages/SchoolSearch/SchoolChangePage'
import MapPage from './pages/Map/MapPage'
import ReportFlowPage from './pages/Report/ReportFlowPage'

// ─── Auth Context ───
interface AuthContextType {
  isLoggedIn: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('safewhale_logged_in') === 'true'
  )

  const login = useCallback(() => {
    localStorage.setItem('safewhale_logged_in', 'true')
    setIsLoggedIn(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('safewhale_logged_in')
    setIsLoggedIn(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/school/change" element={<SchoolChangePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/report" element={<ReportFlowPage />} />
      </Routes>
    </AuthContext.Provider>
  )
}
