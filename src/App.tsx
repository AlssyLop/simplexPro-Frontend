import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ResultadoSimplex from './pages/ResultadoSimplex'
import ResultadoGrafico from './pages/ResultadoGrafico'
import RegistroGrafico from './pages/RegistroGrafico'
import RegistroSimplex from './pages/RegistroSimplex'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/registrar/problema/grafico" element={<RegistroGrafico />} />
      <Route path="/registrar/problema/simplex" element={<RegistroSimplex />} />
      <Route path="/editar/problema/:id/grafico" element={<RegistroGrafico />} />
      <Route path="/editar/problema/:id/simplex" element={<RegistroSimplex />} />
      <Route path="/problema/:id/grafico" element={<ResultadoGrafico />} />
      <Route path="/problema/:id/simplex" element={<ResultadoSimplex />} />
    </Routes>
  )
}

export default App
