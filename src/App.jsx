import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import AnalyzeIndex from './pages/analyze/AnalyzeIndex'
import AnalyzeEditor from './pages/analyze/AnalyzeEditor'
import AnalyzeSession from './pages/analyze/AnalyzeSession'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          {/* Session picker + per-session workspace */}
          <Route path="/analyze" element={<AnalyzeIndex />} />
          <Route path="/analyze/new" element={<AnalyzeEditor />} />
          <Route path="/analyze/:sessionId" element={<AnalyzeSession />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
