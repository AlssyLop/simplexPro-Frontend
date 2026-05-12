import type { IteracionSimplex } from '../types'

interface Props {
  iteracion: IteracionSimplex
  esUltima: boolean
}

function SimplexTableau({ iteracion, esUltima }: Props) {
  const { tabla } = iteracion

  const columnas = Object.keys(tabla)
  const filaCount = tabla[columnas[0]]?.length ?? 0

  return (
    <div className="iteracion">
      <div className="iteracion-header">
        <h3>Iteración {iteracion.iteracion}</h3>
        {!esUltima && (
          <div className="detalles">
            {iteracion.entra && <span>Entra: {iteracion.entra}  </span>}
            {iteracion.sale && <span>Sale: {iteracion.sale}  </span>}
            {iteracion.elementoPivote > 0 && (
              <span>Pivote: {iteracion.elementoPivote}</span>
            )}
          </div>
        )}
      </div>
      <div className="tableau-wrapper">
        <table className="tableau">
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: filaCount }, (_, i) => (
              <tr key={i} className={tabla.base?.[i] === 'Z' ? 'fila-z' : ''}>
                {columnas.map((col) => (
                  <td key={col}>{tabla[col]?.[i] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SimplexTableau
