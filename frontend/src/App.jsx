import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import TraceabilityPage from './pages/TraceabilityPage.jsx'
import { Cpu, Clock, GitPullRequest, Network } from 'lucide-react'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-brand">
             <Cpu size={22} color="#6366f1" />
            <span>Impact Analyzer</span>
          </div>
          <ul className="nav-list">
            <li>
              <NavLink to="/analyze" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <GitPullRequest size={16} />
                Analyze
              </NavLink>
            </li>
            <li>
              <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Clock size={16} />
                History
              </NavLink>
            </li>
            <li>
              <NavLink to="/traceability" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Network size={16} />
                Traceability
              </NavLink>
            </li>
          </ul>
          <div className="sidebar-footer">
            <span className="version-badge">v1.0.0</span>
            <span className="powered-by">Powered by Ollama llama3</span>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/analyze" replace />} />
            <Route path="/analyze" element={<UploadPage />} />
            <Route path="/report/:id" element={<ReportPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/traceability" element={<TraceabilityPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
