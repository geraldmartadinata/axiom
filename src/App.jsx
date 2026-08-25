import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import AnalyzeIndex from './pages/analyze/AnalyzeIndex'
import AnalyzeEditor from './pages/analyze/AnalyzeEditor'
import AnalyzeSession from './pages/analyze/AnalyzeSession'
import Profile from './pages/Profile'
import LegalPage from './pages/LegalPage'
import Contact from './pages/Contact'
import ScrollToTop from './components/ui/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          {/* Session picker + per-session workspace */}
          <Route path="/analyze" element={<AnalyzeIndex />} />
          <Route path="/analyze/new" element={<AnalyzeEditor />} />
          <Route path="/analyze/:sessionId" element={<AnalyzeSession />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<LegalPage docKey="privacy" />} />
          <Route path="/terms" element={<LegalPage docKey="terms" />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
