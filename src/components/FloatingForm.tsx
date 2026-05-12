import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Metodo } from '../types'
import { registrarProblema } from '../api/client'
import type {
  SimplexFormData,
  GraficoFormData,
  SimplexVariable,
  FOTermino,
  SimplexRestriccion,
  CoeficienteRestriccion,
  GraficoRestriccion,
  GraficoCoeficiente,
} from '../types'
import {
  crearSimplexFormDataVacia,
  crearGraficoFormDataVacia,
} from '../types'

interface Props {
  metodo: Metodo
  onClose: () => void
}

type Etapa = 'formulario' | 'confirmacion'

let _contador = 0
function uid(): string {
  return `uid-${++_contador}`
}

const TABS = ['Información general', 'Variables', 'Función objetivo', 'Restricciones']

function FloatingForm({ metodo, onClose }: Props) {
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState<Etapa>('formulario')
  const [tabActivo, setTabActivo] = useState(0)
  const [enviando, setEnviando] = useState(false)

  const [simplex, setSimplex] = useState<SimplexFormData>(crearSimplexFormDataVacia)
  const [grafico, setGrafico] = useState<GraficoFormData>(crearGraficoFormDataVacia)

  const esSimplex = metodo === 'simplex'

  const handleClose = useCallback(() => {
    setSimplex(crearSimplexFormDataVacia())
    setGrafico(crearGraficoFormDataVacia())
    setEtapa('formulario')
    setTabActivo(0)
    onClose()
  }, [onClose])

  const irAConfirmacion = useCallback(() => {
    setEtapa('confirmacion')
  }, [])

  const volverAFormulario = useCallback(() => {
    setEtapa('formulario')
    setTabActivo(0)
  }, [])

  const handleConfirmar = useCallback(async () => {
    setEnviando(true)
    try {
      let payload: Record<string, unknown>
      if (esSimplex) {
        const vars: Record<string, string> = {}
        for (const v of simplex.variables) {
          vars[v.nombre] = v.nombrePersonalizado
        }
        const restricciones = simplex.restricciones.map((r) => {
          const obj: Record<string, unknown> = { signo: r.signo, valor: r.rhs, glosa: '' }
          for (const v of simplex.variables) {
            const coef = r.coeficientes.find((c) => c.variableId === v.id)
            obj[v.nombre] = coef ? coef.valor : 0
          }
          return obj
        })
        const fo: Record<string, unknown> = { tipo: simplex.foTipo }
        for (const v of simplex.variables) {
          const term = simplex.foTerminos.find((t) => t.variableId === v.id)
          fo[v.nombre] = term ? term.coeficiente : 0
        }
        payload = {
          titulo: simplex.titulo,
          descripcion: simplex.descripcion,
          variables: vars,
          restricciones,
          funcion_objetivo: fo,
        }
      } else {
        payload = {
          titulo: grafico.titulo,
          descripcion: grafico.descripcion,
          variables: { x: grafico.nombreX, y: grafico.nombreY },
          restricciones: grafico.restricciones.map((r) => {
            const obj: Record<string, unknown> = { signo: r.signo, valor: r.rhs, glosa: '' }
            const cx = r.coeficientes.find((c) => c.variable === 'x')
            const cy = r.coeficientes.find((c) => c.variable === 'y')
            obj.x = cx ? cx.valor : 0
            obj.y = cy ? cy.valor : 0
            return obj
          }),
          funcion_objetivo: {
            x: grafico.foCoefX,
            y: grafico.foCoefY,
            tipo: grafico.foTipo,
          },
        }
      }
      const res = await registrarProblema(metodo, payload)
      const id = res.mensaje
      handleClose()
      if (esSimplex) {
        navigate(`/resultados/simplex/${id}`)
      } else {
        navigate(`/resultados/grafica/${id}`)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al enviar'
      alert(msg)
    } finally {
      setEnviando(false)
    }
  }, [esSimplex, simplex, grafico, metodo, handleClose, navigate])

  // Simplex handlers
  const agregarVariableSimplex = () => {
    const n = simplex.variables.length + 1
    const nueva: SimplexVariable = {
      id: uid(),
      nombre: `x${n}`,
      nombrePersonalizado: '',
      tipo: 'no-entera',
    }
    setSimplex({ ...simplex, variables: [...simplex.variables, nueva] })
  }

  const eliminarVariableSimplex = (id: string) => {
    const vars = simplex.variables.filter((v) => v.id !== id)
    const renombradas = vars.map((v, i) => ({ ...v, nombre: `x${i + 1}` }))
    const foTerminos = simplex.foTerminos.filter((t) => vars.some((v) => v.id === t.variableId))
    const restricciones = simplex.restricciones.map((r) => ({
      ...r,
      coeficientes: r.coeficientes.filter((c) => vars.some((v) => v.id === c.variableId)),
    }))
    setSimplex({ ...simplex, variables: renombradas, foTerminos, restricciones })
  }

  const actualizarVariableSimplex = (id: string, campo: Partial<SimplexVariable>) => {
    setSimplex({
      ...simplex,
      variables: simplex.variables.map((v) => (v.id === id ? { ...v, ...campo } : v)),
    })
  }

  const agregarFOTermino = () => {
    const varsDisponibles = simplex.variables.filter(
      (v) => !simplex.foTerminos.some((t) => t.variableId === v.id),
    )
    if (varsDisponibles.length === 0) return
    const nuevo: FOTermino = { id: uid(), variableId: varsDisponibles[0].id, coeficiente: 0 }
    setSimplex({ ...simplex, foTerminos: [...simplex.foTerminos, nuevo] })
  }

  const eliminarFOTermino = (id: string) => {
    setSimplex({ ...simplex, foTerminos: simplex.foTerminos.filter((t) => t.id !== id) })
  }

  const actualizarFOTermino = (id: string, campo: Partial<FOTermino>) => {
    setSimplex({
      ...simplex,
      foTerminos: simplex.foTerminos.map((t) => (t.id === id ? { ...t, ...campo } : t)),
    })
  }

  const agregarRestriccionSimplex = () => {
    const nueva: SimplexRestriccion = {
      id: uid(),
      coeficientes: [],
      signo: '<=',
      rhs: 0,
    }
    setSimplex({ ...simplex, restricciones: [...simplex.restricciones, nueva] })
  }

  const eliminarRestriccionSimplex = (id: string) => {
    setSimplex({ ...simplex, restricciones: simplex.restricciones.filter((r) => r.id !== id) })
  }

  const actualizarRestriccionSimplex = (id: string, campo: Partial<SimplexRestriccion>) => {
    setSimplex({
      ...simplex,
      restricciones: simplex.restricciones.map((r) => (r.id === id ? { ...r, ...campo } : r)),
    })
  }

  const agregarCoefRestriccionSimplex = (resId: string) => {
    const res = simplex.restricciones.find((r) => r.id === resId)
    if (!res) return
    const usadas = res.coeficientes.map((c) => c.variableId)
    const disponibles = simplex.variables.filter((v) => !usadas.includes(v.id))
    if (disponibles.length === 0) return
    const nuevo: CoeficienteRestriccion = { id: uid(), variableId: disponibles[0].id, valor: 0 }
    actualizarRestriccionSimplex(resId, {
      coeficientes: [...res.coeficientes, nuevo],
    })
  }

  const eliminarCoefRestriccionSimplex = (resId: string, coefId: string) => {
    const res = simplex.restricciones.find((r) => r.id === resId)
    if (!res) return
    actualizarRestriccionSimplex(resId, {
      coeficientes: res.coeficientes.filter((c) => c.id !== coefId),
    })
  }

  const actualizarCoefRestriccionSimplex = (
    resId: string,
    coefId: string,
    campo: Partial<CoeficienteRestriccion>,
  ) => {
    const res = simplex.restricciones.find((r) => r.id === resId)
    if (!res) return
    actualizarRestriccionSimplex(resId, {
      coeficientes: res.coeficientes.map((c) => (c.id === coefId ? { ...c, ...campo } : c)),
    })
  }

  // Graphical handlers
  const agregarRestriccionGrafico = () => {
    const nueva: GraficoRestriccion = {
      id: uid(),
      coeficientes: [],
      signo: '<=',
      rhs: 0,
    }
    setGrafico({ ...grafico, restricciones: [...grafico.restricciones, nueva] })
  }

  const eliminarRestriccionGrafico = (id: string) => {
    setGrafico({ ...grafico, restricciones: grafico.restricciones.filter((r) => r.id !== id) })
  }

  const actualizarRestriccionGrafico = (id: string, campo: Partial<GraficoRestriccion>) => {
    setGrafico({
      ...grafico,
      restricciones: grafico.restricciones.map((r) => (r.id === id ? { ...r, ...campo } : r)),
    })
  }

  const agregarCoefRestriccionGrafico = (resId: string) => {
    const res = grafico.restricciones.find((r) => r.id === resId)
    if (!res || res.coeficientes.length >= 2) return
    const usadas = res.coeficientes.map((c) => c.variable)
    const disponibles = (['x', 'y'] as const).filter((v) => !usadas.includes(v))
    if (disponibles.length === 0) return
    const nuevo: GraficoCoeficiente = { id: uid(), variable: disponibles[0], valor: 0 }
    actualizarRestriccionGrafico(resId, {
      coeficientes: [...res.coeficientes, nuevo],
    })
  }

  const eliminarCoefRestriccionGrafico = (resId: string, coefId: string) => {
    const res = grafico.restricciones.find((r) => r.id === resId)
    if (!res) return
    actualizarRestriccionGrafico(resId, {
      coeficientes: res.coeficientes.filter((c) => c.id !== coefId),
    })
  }

  const actualizarCoefRestriccionGrafico = (
    resId: string,
    coefId: string,
    campo: Partial<GraficoCoeficiente>,
  ) => {
    const res = grafico.restricciones.find((r) => r.id === resId)
    if (!res) return
    actualizarRestriccionGrafico(resId, {
      coeficientes: res.coeficientes.map((c) => (c.id === coefId ? { ...c, ...campo } : c)),
    })
  }

  // Render helpers
  function renderTabContent() {
    if (esSimplex) return renderSimplexTab()
    return renderGraficoTab()
  }

  // --- Simplex tabs ---
  function renderSimplexTab() {
    switch (tabActivo) {
      case 0:
        return (
          <div className="form-section">
            <div className="form-field">
              <label>Nombre del problema</label>
              <input
                type="text"
                value={simplex.titulo}
                onChange={(e) => setSimplex({ ...simplex, titulo: e.target.value })}
                placeholder="Ej: Producción de sillas"
              />
            </div>
            <div className="form-field">
              <label>Descripción del problema</label>
              <textarea
                value={simplex.descripcion}
                onChange={(e) => setSimplex({ ...simplex, descripcion: e.target.value })}
                placeholder="Describe el problema..."
                rows={4}
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="form-section">
            <button className="btn-secondary btn-sm" onClick={agregarVariableSimplex}>
              + Agregar variable
            </button>
            <div className="cards-grid">
              {simplex.variables.map((v) => (
                <div key={v.id} className="card">
                  <div className="card-header">
                    <span className="card-label">{v.nombre}</span>
                    <button className="btn-danger" onClick={() => eliminarVariableSimplex(v.id)}>✕</button>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={v.nombrePersonalizado}
                        onChange={(e) => actualizarVariableSimplex(v.id, { nombrePersonalizado: e.target.value })}
                        placeholder={v.nombre}
                      />
                    </div>
                    <div className="form-field">
                      <label>Tipo</label>
                      <select
                        value={v.tipo}
                        onChange={(e) => actualizarVariableSimplex(v.id, { tipo: e.target.value as 'entera' | 'no-entera' })}
                      >
                        <option value="no-entera">No entera</option>
                        <option value="entera">Entera</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {simplex.variables.length === 0 && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
                  No hay variables. Haz clic en "Agregar variable".
                </p>
              )}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="form-section">
            <div className="form-field">
              <label>Tipo de función objetivo</label>
              <select
                value={simplex.foTipo}
                onChange={(e) => setSimplex({ ...simplex, foTipo: e.target.value as 'max' | 'min' })}
              >
                <option value="max">Maximizar</option>
                <option value="min">Minimizar</option>
              </select>
            </div>
            {simplex.variables.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                Define variables primero en la sección "Variables".
              </p>
            ) : (
              <>
                <button className="btn-secondary btn-sm" onClick={agregarFOTermino}>
                  + Agregar término
                </button>
                <div className="cards-grid">
                  {simplex.foTerminos.map((t) => {
                    return (
                      <div key={t.id} className="card">
                        <div className="card-row">
                          <div className="form-field" style={{ minWidth: 80 }}>
                            <label>Coeficiente</label>
                            <input
                              type="number"
                              value={t.coeficiente}
                              onChange={(e) => actualizarFOTermino(t.id, { coeficiente: Number(e.target.value) })}
                            />
                          </div>
                          <div className="form-field" style={{ minWidth: 100 }}>
                            <label>Variable</label>
                            <select
                              value={t.variableId}
                              onChange={(e) => actualizarFOTermino(t.id, { variableId: e.target.value })}
                            >
                              {simplex.variables.map((v_) => (
                                <option key={v_.id} value={v_.id}>
                                  {v_.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button className="btn-danger" onClick={() => eliminarFOTermino(t.id)}>✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {simplex.foTerminos.length > 0 && (
                  <div style={{ fontSize: 14, fontFamily: 'var(--mono)', padding: 8, background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                    {simplex.foTipo === 'max' ? 'Max' : 'Min'} Z ={' '}
                    {simplex.foTerminos
                      .map((t) => {
                        const v = simplex.variables.find((v_) => v_.id === t.variableId)
                        return `${t.coeficiente}${v?.nombre ?? '?'}`
                      })
                      .join(' + ') || '0'}
                  </div>
                )}
              </>
            )}
          </div>
        )
      case 3:
        return (
          <div className="form-section">
            {simplex.variables.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                Define variables primero en la sección "Variables".
              </p>
            ) : (
              <>
                <button className="btn-secondary btn-sm" onClick={agregarRestriccionSimplex}>
                  + Agregar restricción
                </button>
                <div className="cards-grid">
                  {simplex.restricciones.map((r) => (
                    <div key={r.id} className="card">
                      <div className="card-header">
                        <span className="card-label">Restricción</span>
                        <button className="btn-danger" onClick={() => eliminarRestriccionSimplex(r.id)}>✕</button>
                      </div>
                      <div className="card-row">
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => agregarCoefRestriccionSimplex(r.id)}
                          disabled={r.coeficientes.length >= simplex.variables.length}
                        >
                          + Coeficiente
                        </button>
                      </div>
                      {r.coeficientes.map((c) => {
                        return (
                          <div key={c.id} className="card-row">
                            <div className="form-field" style={{ minWidth: 80 }}>
                              <input
                                type="number"
                                value={c.valor}
                                onChange={(e) => actualizarCoefRestriccionSimplex(r.id, c.id, { valor: Number(e.target.value) })}
                              />
                            </div>
                            <select
                              value={c.variableId}
                              onChange={(e) => actualizarCoefRestriccionSimplex(r.id, c.id, { variableId: e.target.value })}
                              style={{ padding: 8, border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                            >
                              {simplex.variables.map((v_) => (
                                <option key={v_.id} value={v_.id}>{v_.nombre}</option>
                              ))}
                            </select>
                            <button className="btn-danger" onClick={() => eliminarCoefRestriccionSimplex(r.id, c.id)}>✕</button>
                          </div>
                        )
                      })}
                      <div className="form-row">
                        <div className="form-field" style={{ minWidth: 80 }}>
                          <label>Signo</label>
                          <select
                            value={r.signo}
                            onChange={(e) => actualizarRestriccionSimplex(r.id, { signo: e.target.value as '<=' | '>=' | '=' })}
                          >
                            <option value="<=">{'<='}</option>
                            <option value=">=">{'>='}</option>
                            <option value="=">{'='}</option>
                          </select>
                        </div>
                        <div className="form-field" style={{ minWidth: 80 }}>
                          <label>Valor</label>
                          <input
                            type="number"
                            value={r.rhs}
                            onChange={(e) => actualizarRestriccionSimplex(r.id, { rhs: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {simplex.restricciones.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                    <button className="btn-primary" onClick={irAConfirmacion}>
                      Revisar y confirmar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      default:
        return null
    }
  }

  // --- Graphical tabs ---
  function renderGraficoTab() {
    switch (tabActivo) {
      case 0:
        return (
          <div className="form-section">
            <div className="form-field">
              <label>Nombre del problema</label>
              <input
                type="text"
                value={grafico.titulo}
                onChange={(e) => setGrafico({ ...grafico, titulo: e.target.value })}
                placeholder="Ej: Producción de sillas"
              />
            </div>
            <div className="form-field">
              <label>Descripción del problema</label>
              <textarea
                value={grafico.descripcion}
                onChange={(e) => setGrafico({ ...grafico, descripcion: e.target.value })}
                placeholder="Describe el problema..."
                rows={4}
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="form-section">
            <div className="form-row">
              <div className="form-field">
                <label>Nombre de variable X</label>
                <input
                  type="text"
                  value={grafico.nombreX}
                  onChange={(e) => setGrafico({ ...grafico, nombreX: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Nombre de variable Y</label>
                <input
                  type="text"
                  value={grafico.nombreY}
                  onChange={(e) => setGrafico({ ...grafico, nombreY: e.target.value })}
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="form-section">
            <div className="form-field">
              <label>Tipo de función objetivo</label>
              <select
                value={grafico.foTipo}
                onChange={(e) => setGrafico({ ...grafico, foTipo: e.target.value as 'max' | 'min' })}
              >
                <option value="max">Maximizar</option>
                <option value="min">Minimizar</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Coeficiente de {grafico.nombreX}</label>
                <input
                  type="number"
                  value={grafico.foCoefX}
                  onChange={(e) => setGrafico({ ...grafico, foCoefX: Number(e.target.value) })}
                />
              </div>
              <div className="form-field">
                <label>Coeficiente de {grafico.nombreY}</label>
                <input
                  type="number"
                  value={grafico.foCoefY}
                  onChange={(e) => setGrafico({ ...grafico, foCoefY: Number(e.target.value) })}
                />
              </div>
            </div>
            <div style={{ fontSize: 14, fontFamily: 'var(--mono)', padding: 8, background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              {grafico.foTipo === 'max' ? 'Max' : 'Min'} Z = {grafico.foCoefX}{grafico.nombreX} + {grafico.foCoefY}{grafico.nombreY}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="form-section">
            <button className="btn-secondary btn-sm" onClick={agregarRestriccionGrafico}>
              + Agregar restricción
            </button>
            <div className="cards-grid">
              {grafico.restricciones.map((r) => (
                <div key={r.id} className="card">
                  <div className="card-header">
                    <span className="card-label">Restricción</span>
                    <button className="btn-danger" onClick={() => eliminarRestriccionGrafico(r.id)}>✕</button>
                  </div>
                  <div className="card-row">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => agregarCoefRestriccionGrafico(r.id)}
                      disabled={r.coeficientes.length >= 2}
                    >
                      + Coeficiente
                    </button>
                  </div>
                  {r.coeficientes.map((c) => (
                    <div key={c.id} className="card-row">
                      <div className="form-field" style={{ minWidth: 80 }}>
                        <input
                          type="number"
                          value={c.valor}
                          onChange={(e) => actualizarCoefRestriccionGrafico(r.id, c.id, { valor: Number(e.target.value) })}
                        />
                      </div>
                      <select
                        value={c.variable}
                        onChange={(e) => actualizarCoefRestriccionGrafico(r.id, c.id, { variable: e.target.value as 'x' | 'y' })}
                        style={{ padding: 8, border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                      >
                        <option value="x">{grafico.nombreX}</option>
                        <option value="y">{grafico.nombreY}</option>
                      </select>
                      <button className="btn-danger" onClick={() => eliminarCoefRestriccionGrafico(r.id, c.id)}>✕</button>
                    </div>
                  ))}
                  <div className="form-row">
                    <div className="form-field" style={{ minWidth: 80 }}>
                      <label>Signo</label>
                      <select
                        value={r.signo}
                        onChange={(e) => actualizarRestriccionGrafico(r.id, { signo: e.target.value as '<=' | '>=' | '=' })}
                      >
                        <option value="<=">{'<='}</option>
                        <option value=">=">{'>='}</option>
                        <option value="=">{'='}</option>
                      </select>
                    </div>
                    <div className="form-field" style={{ minWidth: 80 }}>
                      <label>Valor</label>
                      <input
                        type="number"
                        value={r.rhs}
                        onChange={(e) => actualizarRestriccionGrafico(r.id, { rhs: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {grafico.restricciones.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <button className="btn-primary" onClick={irAConfirmacion}>
                  Revisar y confirmar
                </button>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  // --- Confirmation ---
  function renderConfirmacion() {
    if (esSimplex) {
      const foStr = simplex.foTerminos.length > 0
        ? simplex.foTerminos.map((t) => {
            const v = simplex.variables.find((v_) => v_.id === t.variableId)
            return `${t.coeficiente}${v?.nombre ?? '?'}`
          }).join(' + ')
        : '0'

      return (
        <div className="confirmacion">
          <div className="confirmacion-section">
            <h3>Información general</h3>
            <div className="confirmacion-text">
              <strong>{simplex.titulo || '(sin título)'}</strong>
            </div>
            {simplex.descripcion && (
              <div className="confirmacion-scroll">
                <div className="confirmacion-text">{simplex.descripcion}</div>
              </div>
            )}
          </div>

          <div className="confirmacion-section">
            <h3>Variables ({simplex.variables.length})</h3>
            {simplex.variables.length > 0 ? (
              <div className="confirmacion-scroll">
                {simplex.variables.map((v) => (
                  <div key={v.id} className="confirmacion-item">
                    {v.nombre}: {v.nombrePersonalizado || v.nombre} ({v.tipo === 'entera' ? 'Entera' : 'No entera'})
                  </div>
                ))}
              </div>
            ) : (
              <div className="confirmacion-text" style={{ color: 'var(--color-text-secondary)' }}>Sin variables</div>
            )}
          </div>

          <div className="confirmacion-section">
            <h3>Función objetivo</h3>
            <div className="confirmacion-text" style={{ fontFamily: 'var(--mono)' }}>
              {simplex.foTipo === 'max' ? 'Max' : 'Min'} Z = {foStr}
            </div>
          </div>

          <div className="confirmacion-section">
            <h3>Restricciones ({simplex.restricciones.length})</h3>
            {simplex.restricciones.length > 0 ? (
              <div className="confirmacion-scroll">
                {simplex.restricciones.map((r) => {
                  const terminos = simplex.variables.map((v) => {
                    const c = r.coeficientes.find((c_) => c_.variableId === v.id)
                    return `${c ? c.valor : 0}${v.nombre}`
                  }).join(' + ')
                  return (
                    <div key={r.id} className="confirmacion-item">
                      {terminos} {r.signo} {r.rhs}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="confirmacion-text" style={{ color: 'var(--color-text-secondary)' }}>Sin restricciones</div>
            )}
          </div>

          <div className="confirmacion-actions">
            <button className="btn-primary" onClick={handleConfirmar} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Confirmar'}
            </button>
            <button className="btn-secondary" onClick={volverAFormulario}>
              Editar
            </button>
          </div>
        </div>
      )
    }

    const foStr = `${grafico.foCoefX}${grafico.nombreX} + ${grafico.foCoefY}${grafico.nombreY}`
    return (
      <div className="confirmacion">
        <div className="confirmacion-section">
          <h3>Información general</h3>
          <div className="confirmacion-text">
            <strong>{grafico.titulo || '(sin título)'}</strong>
          </div>
          {grafico.descripcion && (
            <div className="confirmacion-scroll">
              <div className="confirmacion-text">{grafico.descripcion}</div>
            </div>
          )}
        </div>

        <div className="confirmacion-section">
          <h3>Variables</h3>
          <div className="confirmacion-text" style={{ fontFamily: 'var(--mono)' }}>
            {grafico.nombreX} (x), {grafico.nombreY} (y)
          </div>
        </div>

        <div className="confirmacion-section">
          <h3>Función objetivo</h3>
          <div className="confirmacion-text" style={{ fontFamily: 'var(--mono)' }}>
            {grafico.foTipo === 'max' ? 'Max' : 'Min'} Z = {foStr}
          </div>
        </div>

        <div className="confirmacion-section">
          <h3>Restricciones ({grafico.restricciones.length})</h3>
          {grafico.restricciones.length > 0 ? (
            <div className="confirmacion-scroll">
              {grafico.restricciones.map((r) => {
                const cx = r.coeficientes.find((c) => c.variable === 'x')
                const cy = r.coeficientes.find((c) => c.variable === 'y')
                const tx = cx ? `${cx.valor}${grafico.nombreX}` : `0${grafico.nombreX}`
                const ty = cy ? `${cy.valor}${grafico.nombreY}` : `0${grafico.nombreY}`
                return (
                  <div key={r.id} className="confirmacion-item">
                    {tx} + {ty} {r.signo} {r.rhs}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="confirmacion-text" style={{ color: 'var(--color-text-secondary)' }}>Sin restricciones</div>
          )}
        </div>

        <div className="confirmacion-actions">
          <button className="btn-primary" onClick={handleConfirmar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Confirmar'}
          </button>
          <button className="btn-secondary" onClick={volverAFormulario}>
            Editar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            {etapa === 'confirmacion' && (
              <button className="btn-back" onClick={volverAFormulario} title="Volver al formulario">
                &lt;
              </button>
            )}
            <span className="modal-header-title">
              {esSimplex ? 'Método Simplex' : 'Método Gráfico'}
            </span>
          </div>
          <button className="modal-header-close" onClick={handleClose} title="Cerrar">
            X
          </button>
        </div>

        {etapa === 'formulario' && (
          <>
            <div className="tabs">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  className={`tab${i === tabActivo ? ' active' : ''}`}
                  onClick={() => setTabActivo(i)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="form-content">
              {renderTabContent()}
            </div>
          </>
        )}

        {etapa === 'confirmacion' && renderConfirmacion()}
      </div>
    </div>
  )
}

export default FloatingForm
