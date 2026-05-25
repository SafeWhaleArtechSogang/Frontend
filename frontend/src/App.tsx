import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage'
import SchoolSearchPage from './pages/SchoolSearch/SchoolSearchPage'
import SchoolChangePage from './pages/SchoolSearch/SchoolChangePage'
import MapPage from './pages/Map/MapPage'
import ReportFlowPage from './pages/Report/ReportFlowPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/school/search" element={<SchoolSearchPage />} />
      <Route path="/school/change" element={<SchoolChangePage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/report" element={<ReportFlowPage />} />
    </Routes>
  )
}
