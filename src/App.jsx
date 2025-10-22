import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AnalysisDashboard from './AnalysisDashboard.jsx'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <AnalysisDashboard />
    </div>
  )
}

export default App
