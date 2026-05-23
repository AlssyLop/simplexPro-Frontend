import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactPaginateOriginal from 'react-paginate'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPaginate = (ReactPaginateOriginal as any).default ?? ReactPaginateOriginal
import { listarProblemas, eliminarProblema } from '../api/client'
import type { ResumenProblema } from '../types'
import iconoSimplex from '../assets/iconoSimplex.png'
import iconoGrafico from '../assets/iconoGrafico.png'
import basurero from '../assets/basurero.png'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../components/Toast'

function DashboardContent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['problemas', page],
    queryFn: () => listarProblemas(page),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const problemas = data?.problemas ?? []
  const totalPaginas = data?.pagination.totalPages ?? 0

  const deleteMutation = useMutation({
    mutationFn: eliminarProblema,
    onSuccess: () => {
      setToast({ message: 'Problema eliminado correctamente.', type: 'success' })
      if (problemas.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      }
      queryClient.invalidateQueries({ queryKey: ['problemas'] })
    },
    onError: () => {
      setToast({ message: 'Error al eliminar el problema.', type: 'error' })
    },
    onSettled: () => {
      setConfirmId(null)
    },
  })

  const handlePageClick = (e: { selected: number }) => {
    setPage(e.selected + 1)
  }

  const handleEliminarClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmId(id)
  }

  const ejecutarEliminacion = () => {
    if (!confirmId) return
    deleteMutation.mutate(confirmId)
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

        {isLoading && <div className="loading" style={{ padding: '40px 0' }}>Cargando problemas...</div>}

        {isError && (
          <div className="result-mensaje error" style={{ marginBottom: 16 }}>
            No se pudieron cargar los problemas.{' '}
            <button onClick={() => refetch()} className="btn-secondary btn-sm" style={{ marginLeft: 8 }}>Reintentar</button>
          </div>
        )}

        {!isLoading && !isError && problemas.length > 0 && (
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
                      <img src={basurero} alt="eliminar" className="basurero-img" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination-bar">
              <ReactPaginate
                previousLabel="‹"
                nextLabel="›"
                breakLabel="…"
                pageCount={totalPaginas}
                marginPagesDisplayed={1}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName="pagination"
                activeClassName="active"
                forcePage={page - 1}
                disabledClassName="disabled"
              />
            </div>
          </>
        )}
      </div>

      {!isLoading && !isError && problemas.length === 0 && (
        <div className="empty-display">
          Aún no has creado ningún problema. ¡Empieza creando uno nuevo!
        </div>
      )}

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

function Dashboard() {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  )
}

export default Dashboard