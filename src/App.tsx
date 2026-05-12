import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ResultadoSimplex from './pages/ResultadoSimplex'
import ResultadoGrafico from './pages/ResultadoGrafico'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/resultados/simplex/:id" element={<ResultadoSimplex />} />
      <Route path="/resultados/grafica/:id" element={<ResultadoGrafico />} />
    </Routes>
  )
}

export default App
