import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarProblemas, eliminarProblema } from '../api/client'
import type { ResumenProblema } from '../types'
import iconoSimplex from '../assets/iconoSimplex.png'
import iconoGrafico from '../assets/iconoGrafico.png'
import basurero from '../assets/basurero.png'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../components/Toast'

const ITEMS_POR_PAGINA = 6

function Dashboard() {
  const navigate = useNavigate()
  const [problemas, setProblemas] = useState<ResumenProblema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const cargarProblemas = (p: number) => {
    setLoading(true)
    setError(null)
    listarProblemas(p)
      .then((list) => {
        setProblemas(list)
        setHasNext(list.length >= ITEMS_POR_PAGINA)
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudieron cargar los problemas.')
        setLoading(false)
      })
  }

  useEffect(() => {
    listarProblemas(page)
      .then((list) => {
        setProblemas(list)
        setHasNext(list.length >= ITEMS_POR_PAGINA)
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudieron cargar los problemas.')
        setLoading(false)
      })
  }, [page])

  const handleEliminarClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que el clic abra la tarjeta
    setConfirmId(id)
  }

  const ejecutarEliminacion = async () => {
    if (!confirmId) return
    try {
      await eliminarProblema(confirmId)
      setToast({ message: 'Problema eliminado correctamente.', type: 'success' })
      if (problemas.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        cargarProblemas(page)
      }
    } catch {
      setToast({ message: 'Error al eliminar el problema.', type: 'error' })
    } finally {
      setConfirmId(null)
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
        <h2 className="dashboard-section-title">Problemas Recientes</h2>
        
        {loading && <div className="loading" style={{ padding: '40px 0' }}>Cargando problemas...</div>}
        
        {error && (
          <div className="result-mensaje error" style={{ marginBottom: 16 }}>
            {error} <button onClick={() => cargarProblemas(page)} className="btn-secondary btn-sm" style={{ marginLeft: 8 }}>Reintentar</button>
          </div>
        )}

        {!loading && !error && problemas.length === 0 && (
          <div className="empty-display">
            {page > 1 ? 'No hay más problemas.' : 'Aún no has creado ningún problema. ¡Empieza creando uno nuevo!'}
          </div>
        )}

        {!loading && !error && problemas.length > 0 && (
          <>
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
                      className="btn-danger btn-sm"
                      onClick={(e) => handleEliminarClick(p.id, e)}
                      title="Eliminar problema"
                    >
                      <img src={basurero} alt="eliminar" className="basurero-img"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <button
                className="btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Anterior
              </button>
              <span className="pagination-info">Página {page}</span>
              <button
                className="btn-secondary btn-sm"
                disabled={!hasNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmId !== null}
        title="¿Eliminar problema?"
        message="Esta acción no se puede deshacer. El problema se borrará permanentemente."
        onConfirm={ejecutarEliminacion}
        onCancel={() => setConfirmId(null)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Dashboard
