import { useState } from 'react'
import FloatingForm from '../components/FloatingForm'
import type { Metodo } from '../types'

function Dashboard() {
  const [metodo, setMetodo] = useState<Metodo | null>(null)

  return (
    <div className="dashboard">
      <h1>OptimaPL</h1>
      <p>
        Resuelve problemas de programación lineal de forma interactiva.
        Elige el método que prefieras para comenzar.
      </p>
      <div className="dashboard-buttons">
        <button className="btn-metodo" onClick={() => setMetodo('simplex')}>
          <span className="btn-metodo-icon">⊞</span>
          Método Simplex
        </button>
        <button className="btn-metodo" onClick={() => setMetodo('grafico')}>
          <span className="btn-metodo-icon">⊟</span>
          Método Gráfico
        </button>
      </div>
      {metodo && (
        <FloatingForm metodo={metodo} onClose={() => setMetodo(null)} />
      )}
    </div>
  )
}

export default Dashboard
