import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarProblemas, eliminarProblema } from '../api/client'
import type { ResumenProblema } from '../types'
import iconoSimplex from '../assets/iconoSimplex.png'
import iconoGrafico from '../assets/iconoGrafico.png'

function Dashboard() {
  const navigate = useNavigate()
  const [problemas, setProblemas] = useState<ResumenProblema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarProblemas = () => {
    setLoading(true)
    setError(null)
    listarProblemas(1)
      .then((list) => {
        setProblemas(list)
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudieron cargar los problemas.')
        setLoading(false)
      })
  }

  useEffect(() => {
    listarProblemas(1)
      .then((list) => {
        setProblemas(list)
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudieron cargar los problemas.')
        setLoading(false)
      })
  }, [])

  const handleEliminar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que el clic abra la tarjeta
    if (!window.confirm('¿Seguro que deseas eliminar este problema?')) return
    try {
      await eliminarProblema(id)
      setProblemas((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('Error al eliminar')
    }
  }

  const irAlProblema = (p: ResumenProblema) => {
    const ruta = p.metodo.toLowerCase() === 'grafico' ? 'grafico' : 'simplex'
    navigate(`/problema/${p.id}/${ruta}`)
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-titles">
          <h1>OptimaPL</h1>
          <p>Resuelve problemas de programación lineal de forma interactiva.</p>
        </div>
        <div className="dashboard-buttons">
          <button className="btn-metodo" onClick={() => navigate('/registrar/problema/simplex')}>
            <img src={iconoSimplex} alt="Método Simplex" className="btn-metodo-img" />
            Método Simplex
          </button>
          <button className="btn-metodo" onClick={() => navigate('/registrar/problema/grafico')}>
            <img src={iconoGrafico} alt="Método Gráfico" className="btn-metodo-img" />
            Método Gráfico
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <h2>Problemas Recientes</h2>
        
        {loading && <div className="result-mensaje">Cargando problemas...</div>}
        
        {error && (
          <div className="result-mensaje error">
            {error} <button onClick={() => cargarProblemas()} className="btn-secondary btn-sm">Reintentar</button>
          </div>
        )}

        {!loading && !error && problemas.length === 0 && (
          <div className="result-mensaje">
            Aún no has creado ningún problema. ¡Empieza creando uno nuevo!
          </div>
        )}

        {!loading && !error && problemas.length > 0 && (
          <div className="dashboard-grid">
            {problemas.map((p) => (
              <div key={p.id} className="problem-card" onClick={() => irAlProblema(p)}>
                <div className="problem-card-header">
                  <h3>{p.titulo}</h3>
                  <div className="problem-badges">
                    <span className={`badge badge-${p.metodo.toLowerCase()}`}>{p.metodo}</span>
                    <span className={`badge badge-${p.tipoOptimizacion.toLowerCase()}`}>{p.tipoOptimizacion}</span>
                  </div>
                </div>
                {p.descripcion && <p className="problem-desc">{p.descripcion}</p>}
                <div className="problem-card-footer">
                  <span className="problem-date">
                    {new Date(p.fechaCreacion).toLocaleDateString()}
                  </span>
                  <button
                    className="btn-danger btn-sm btn-icon"
                    onClick={(e) => handleEliminar(p.id, e)}
                    title="Eliminar problema"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
