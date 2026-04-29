import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CaseUpload from './components/CaseUpload'
import CaseList from './components/CaseList'
import Dashboard from './components/Dashboard'
import Navigation from './components/Navigation'

function App() {
  const [cases, setCases] = useState([])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<CaseList cases={cases} />} />
            <Route path="/upload" element={<CaseUpload onCaseAdded={(newCase) => setCases([...cases, newCase])} />} />
            <Route path="/dashboard" element={<Dashboard cases={cases} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
