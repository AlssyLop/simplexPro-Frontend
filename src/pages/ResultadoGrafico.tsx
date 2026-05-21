import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MostrarResultadoGrafico } from '../types'
import { obtenerSolucionGrafica } from '../api/client'

function ResultadoGrafico() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<MostrarResultadoGrafico | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    obtenerSolucionGrafica(id)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error al cargar la solución'))
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

  const tieneGrafico = data.grafico && data.grafico.length > 0
  const esOptima = data.mensaje.toLowerCase().includes('óptima') || data.mensaje.toLowerCase().includes('optima')

  return (
    <div className="result-page">
      <div className="page-header">
        <h1>OptimaPL</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/editar/problema/${id}/grafico`)}>Editar</button>
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

        <div className={`result-mensaje ${!esOptima ? 'info' : ''}`}>
          {data.mensaje}
        </div>

        {data.restricciones.length > 0 && (
          <div className="result-info">
            <h3 className="result-subtitle">Restricciones</h3>
            <ul className='result-restricciones'>
              {data.restricciones.map((r, i) => (
                <li key={i}>{r.inecuacion}</li>
              ))}
            </ul>
          </div>
        )}

        {tieneGrafico ? (
          <div className="result-graph">
            <img src={`data:image/png;base64,${data.grafico}`} alt="Gráfico de solución" />
          </div>
        ) : (
          <div className="result-mensaje info">
            No se encontró una región factible
          </div>
        )}

        {data.valoresFO.length > 0 && (
          <div className="result-info">
            <h3 className="result-subtitle">Evaluación en vértices</h3>
            <ul className="result-valores">
              {data.valoresFO.map((v, i) => {
                const esOptimo = v.toLowerCase().includes('óptimo') || v.toLowerCase().includes('optimo')
                return (
                  <li key={i} className={esOptimo ? 'optimo' : ''}>
                    {v}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultadoGrafico
