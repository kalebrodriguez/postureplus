import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { CoachPage } from './pages/CoachPage'
import { ProgressPage } from './pages/ProgressPage'
import { PrivacyPage } from './pages/PrivacyPage'
import './styles/global.css'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
