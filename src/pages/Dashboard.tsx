import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <h1>OptimaPL</h1>
      <p>
        Resuelve problemas de programación lineal de forma interactiva.
        Elige el método que prefieras para comenzar.
      </p>
      <div className="dashboard-buttons">
        <button className="btn-metodo" onClick={() => navigate('/registrar/problema/simplex')}>
          <span className="btn-metodo-icon">⊞</span>
          Método Simplex
        </button>
        <button className="btn-metodo" onClick={() => navigate('/registrar/problema/grafico')}>
          <span className="btn-metodo-icon">⊟</span>
          Método Gráfico
        </button>
      </div>
    </div>
  )
}

export default Dashboard
