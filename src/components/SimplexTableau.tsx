import type { IteracionSimplex } from '../types'

interface Props {
  iteracion: IteracionSimplex
  esUltima: boolean
}

function SimplexTableau({ iteracion, esUltima }: Props) {
  const { tabla } = iteracion
  const columnas = Object.keys(tabla)
  const filaCount = tabla[columnas[0]]?.length ?? 0

  const colPivote = !esUltima && iteracion.entra
    ? columnas.indexOf(iteracion.entra)
    : -1

  const filaPivote = !esUltima && iteracion.sale && tabla.base
    ? tabla.base.indexOf(iteracion.sale)
    : -1

  function className(fila: number): string {
    const classes: string[] = []
    if (tabla.base?.[fila] === 'Z') classes.push('fila-z')
    if (fila === filaPivote) classes.push('fila-pivote')
    return classes.join(' ')
  }

  function cellClass(col: number, fila: number): string {
    const classes: string[] = []
    if (col === colPivote) classes.push('col-pivote')
    if (col === colPivote && fila === filaPivote) classes.push('celda-pivote')
    return classes.join(' ')
  }

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
              {columnas.map((col, i) => (
                <th key={col} className={i === colPivote ? 'col-pivote' : ''}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: filaCount }, (_, i) => (
              <tr key={i} className={className(i)}>
                {columnas.map((col, j) => (
                  <td key={col} className={cellClass(j, i)}>
                    {tabla[col]?.[i] ?? ''}
                  </td>
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
