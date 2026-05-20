import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MostrarResultadoSimplex } from '../types'
import { obtenerSolucionSimplex } from '../api/client'
import SimplexTableau from '../components/SimplexTableau'

function ResultadoSimplex() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<MostrarResultadoSimplex | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    obtenerSolucionSimplex(id)
      .then(setData)
      .catch((e) => setError(e.message ?? 'Error al cargar la solución'))
  }, [id])

  if (error) {
    return (
      <div className="result-page">
        <div className="page-header">
          <h1>OptimaPL</h1>
          <button onClick={() => navigate('/')}>Volver</button>
        </div>
        <div className="error-display">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="result-page">
        <div className="page-header">
          <h1>OptimaPL</h1>
        </div>
        <div className="loading">Cargando solución...</div>
      </div>
    )
  }

  const esOptima = data.mensaje.toLowerCase().includes('óptima') || data.mensaje.toLowerCase().includes('optima')

  return (
    <div className="result-page">
      <div className="page-header">
        <h1>OptimaPL</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/editar/problema/${id}/simplex`)}>Editar</button>
          <button onClick={() => navigate('/')}>Volver</button>
        </div>
      </div>
      <div className="result-content">
        <div className="result-info">
          <h2>{data.titulo}</h2>
          {data.descripcion && <p className="subtitulo">{data.descripcion}</p>}
          <p style={{ fontFamily: 'var(--mono)', fontSize: 15, margin: 0 }}>
            {data.funcion_objetivo}
          </p>
        </div>

        <div className={`result-mensaje ${esOptima ? '' : 'info'}`}>
          {data.mensaje}
        </div>

        {data.valorFO && (
          <div className="result-info" style={{ marginBottom: 16 }}>
            {data.valorFO}
          </div>
        )}

        {data.iteraciones.map((it, i) => (
          <SimplexTableau
            key={i}
            iteracion={it}
            esUltima={i === data.iteraciones.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

export default ResultadoSimplex
