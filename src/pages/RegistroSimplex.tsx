import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChangeEvent } from 'react'
import type {
  SimplexFormData,
  SimplexRestriccion,
  FormErrors,
  ApiPayloadSimplex,
  Signo,
  Optimizacion,
  ProblemaSimplexEditable,
} from '../types'
import {
  crearSimplexFormDataVacia,
  generarId,
  mapApiToSimplexFormData,
  inicializarRestriccion,
  inicializarVariables,
  parseNumericString,
} from '../types'
import {
  obtenerFormulario,
  registrarProblemaSimplex,
  actualizarProblemaSimplex,
  ApiRequestError,
} from '../api/client'
import { FormInput } from '../components/FormInput'
import { NumericTextInput } from '../components/NumericTextInput'
import { FormSelect } from '../components/FormSelect'
import { SummaryModal } from '../components/SummaryModal'

// ---------------------------------------------------------------------------
// Opciones constantes
// ---------------------------------------------------------------------------

const SIGNO_OPTIONS = [
  { value: '<=', label: '≤' },
  { value: '>=', label: '≥' },
  { value: '=', label: '=' },
]

const TIPO_OPTIONS = [
  { value: 'max', label: 'Maximizar' },
  { value: 'min', label: 'Minimizar' },
]

const SIGNO_DISPLAY: Record<string, string> = {
  '<=': '≤',
  '>=': '≥',
  '=': '=',
}

// ---------------------------------------------------------------------------
// Validación del lado del cliente
// ---------------------------------------------------------------------------

function validarFormulario(data: SimplexFormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.titulo.trim()) {
    errors['titulo'] = 'El título es requerido'
  }

  if (data.variables.length < 2) {
    errors['variables'] = 'Se requieren al menos 2 variables'
  }

  data.variables.forEach((v) => {
    if (!v.nombre.trim()) {
      errors[`var_${v.id}`] = 'Requerido'
    }
  })

  data.foTerminos.forEach((fo) => {
    if (fo.coeficiente === '' || isNaN(parseNumericString(fo.coeficiente))) {
      errors[`fo_${fo.variableId}`] = 'Debe ser un número'
    }
  })

  if (data.restricciones.length === 0) {
    errors['restricciones'] = 'Debes agregar al menos una restricción'
  }

  data.restricciones.forEach((r) => {
    if (r.constante === '' || isNaN(parseNumericString(r.constante))) {
      errors[`restriccion_${r.id}_constante`] = 'Requerido'
    }
    r.coeficientes.forEach((c) => {
      if (c.coeficiente === '' || isNaN(parseNumericString(c.coeficiente))) {
        errors[`restriccion_${r.id}_coef_${c.variableId}`] = 'Requerido'
      }
    })
  })

  return errors
}

// ---------------------------------------------------------------------------
// Transformación de estado local → payload API
// ---------------------------------------------------------------------------

function buildPayload(data: SimplexFormData): ApiPayloadSimplex {
  const variablesMap: Record<string, string> = {}
  data.variables.forEach(v => {
    variablesMap[v.variable] = v.nombre.trim()
  })

  return {
    titulo: data.titulo.trim(),
    descripcion: data.descripcion.trim() || undefined,
    variables: variablesMap,
    funcion_objetivo: {
      tipo: data.foTipo,
      terminos: data.foTerminos.reduce((acc, fo) => {
        const variable = data.variables.find(v => v.id === fo.variableId)!
        acc[variable.variable] = parseNumericString(fo.coeficiente)
        return acc
      }, {} as Record<string, number>)
    },
    restricciones: data.restricciones.map(r => ({
      signo: r.signo,
      constante: parseNumericString(r.constante),
      glosa: r.glosa.trim() || undefined,
      terminos: r.coeficientes.reduce((acc, c) => {
        const variable = data.variables.find(v => v.id === c.variableId)!
        acc[variable.variable] = parseNumericString(c.coeficiente)
        return acc
      }, {} as Record<string, number>)
    }))
  }
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function RegistroSimplex() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const esEdicion = !!id

  // Estado inicial: 2 variables, 1 restricción
  const [form, setForm] = useState<SimplexFormData>(() => {
    const base = crearSimplexFormDataVacia()
    const { variables, foTerminos } = inicializarVariables(2)
    return {
      ...base,
      variables,
      foTerminos,
      restricciones: [inicializarRestriccion(variables)]
    }
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(esEdicion)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  // --- Carga de datos en modo edición ---

  useEffect(() => {
    if (!id) return
    obtenerFormulario(id)
      .then((res) => {
        setForm(mapApiToSimplexFormData(res as ProblemaSimplexEditable))
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (e instanceof ApiRequestError && e.status === 404) {
          setLoadError('El problema que intentas editar no existe.')
        } else {
          setLoadError('No se pudieron cargar los datos del problema.')
        }
        setLoading(false)
      })
  }, [id])

  function handleRetry() {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    obtenerFormulario(id)
      .then((res) => setForm(mapApiToSimplexFormData(res as ProblemaSimplexEditable)))
      .catch(() => setLoadError('No se pudieron cargar los datos del problema.'))
      .finally(() => setLoading(false))
  }

  // --- Modificación de Estructura ---

  function handleCantidadVariablesChange(e: ChangeEvent<HTMLInputElement>) {
    const qty = parseInt(e.target.value, 10)
    if (isNaN(qty) || qty < 2 || qty > 20) return // Límites razonables

    setForm(prev => {
      const currentCount = prev.variables.length
      if (qty === currentCount) return prev

      const copy = { ...prev }
      const newVariables = [...prev.variables]
      const newFoTerminos = [...prev.foTerminos]
      const newRestricciones = prev.restricciones.map(r => ({
        ...r,
        coeficientes: [...r.coeficientes]
      }))

      if (qty > currentCount) {
        // Agregar variables
        for (let i = currentCount; i < qty; i++) {
          const varId = generarId()
          newVariables.push({ id: varId, variable: `x${i + 1}`, nombre: '' })
          newFoTerminos.push({ id: generarId(), variableId: varId, coeficiente: '' })
          newRestricciones.forEach(r => {
            r.coeficientes.push({ id: generarId(), variableId: varId, coeficiente: '' })
          })
        }
      } else {
        // Quitar variables
        newVariables.splice(qty)
        newFoTerminos.splice(qty)
        const keptIds = new Set(newVariables.map(v => v.id))
        newRestricciones.forEach(r => {
          r.coeficientes = r.coeficientes.filter(c => keptIds.has(c.variableId))
        })
      }

      return {
        ...copy,
        variables: newVariables,
        foTerminos: newFoTerminos,
        restricciones: newRestricciones
      }
    })
  }

  function addRestriccion() {
    if (!ultimaRestriccionCompleta()) {
      setShowFieldErrors(true)
      return
    }
    setShowFieldErrors(false)
    setForm(prev => ({
      ...prev,
      restricciones: [...prev.restricciones, inicializarRestriccion(prev.variables)]
    }))
  }

  function removeRestriccion(idToRemove: string) {
    setForm(prev => ({
      ...prev,
      restricciones: prev.restricciones.filter(r => r.id !== idToRemove)
    }))
  }

  // --- Helpers de Input ---

  function updateVarName(id: string, value: string) {
    setForm(prev => ({
      ...prev,
      variables: prev.variables.map(v => v.id === id ? { ...v, nombre: value } : v)
    }))
  }

  function updateFOCoef(varId: string, raw: string) {
    setForm(prev => ({
      ...prev,
      foTerminos: prev.foTerminos.map(fo => fo.variableId === varId ? { ...fo, coeficiente: raw } : fo)
    }))
  }

  function updateRestriccion<K extends keyof SimplexRestriccion>(rId: string, field: K, value: SimplexRestriccion[K]) {
    setForm(prev => ({
      ...prev,
      restricciones: prev.restricciones.map(r => r.id === rId ? { ...r, [field]: value } : r)
    }))
  }

  function updateRestriccionCoef(rId: string, varId: string, raw: string) {
    setShowFieldErrors(false)
    setForm(prev => ({
      ...prev,
      restricciones: prev.restricciones.map(r => {
        if (r.id !== rId) return r
        return {
          ...r,
          coeficientes: r.coeficientes.map(c => c.variableId === varId ? { ...c, coeficiente: raw } : c)
        }
      })
    }))
  }

  function updateRestriccionConstante(rId: string, raw: string) {
    setShowFieldErrors(false)
    updateRestriccion(rId, 'constante', raw)
  }

  function ultimaRestriccionCompleta(): boolean {
    if (form.restricciones.length === 0) return true
    const r = form.restricciones[form.restricciones.length - 1]
    return (
      r.coeficientes.every(c => c.coeficiente !== '') &&
      r.constante !== ''
    )
  }

  // --- Resumen y Submit ---

  function handleOpenSummary() {
    setServerError('')
    const validationErrors = validarFormulario(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      setShowSummary(true)
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const payload = buildPayload(form)
      if (id) {
        await actualizarProblemaSimplex(id, payload)
        navigate(`/problema/${id}/simplex`)
      } else {
        const result = await registrarProblemaSimplex(payload)
        navigate(`/problema/${result.id}/simplex`)
      }
    } catch (err) {
      setShowSummary(false)
      if (err instanceof ApiRequestError) {
        if (err.status >= 500) {
          setServerError('Ocurrió un error al resolver el problema. Intenta de nuevo.')
        } else {
          setServerError(err.detail)
        }
      } else {
        setServerError('Error de conexión. Verifica tu red e intenta de nuevo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Formateo para Modal ---

  function formatFO(): string {
    const tipo = form.foTipo.toUpperCase()
    const terminos = form.foTerminos.map((fo, i) => {
      const v = form.variables.find(vx => vx.id === fo.variableId)
      const name = v?.nombre || `x${i+1}`
      const coef = fo.coeficiente === '' ? '?' : fo.coeficiente
      return i === 0 ? `${coef}${name}` : `+ ${coef}${name}`
    }).join(' ')
    return `${tipo} Z = ${terminos}`
  }

  function formatRestriccion(r: SimplexRestriccion): string {
    const base = r.coeficientes.map((c, i) => {
      const v = form.variables.find(vx => vx.id === c.variableId)
      const name = v?.nombre || `x${i+1}`
      const coef = c.coeficiente === '' ? '?' : c.coeficiente
      return i === 0 ? `${coef}${name}` : `+ ${coef}${name}`
    }).join(' ')
    const signo = SIGNO_DISPLAY[r.signo] ?? r.signo
    const constante = r.constante === '' ? '?' : r.constante
    const eq = `${base} ${signo} ${constante}`
    return r.glosa.trim() ? `${eq} (${r.glosa.trim()})` : eq
  }

  // --- Auto-scroll a errores del servidor ---

  const errorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (serverError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [serverError])

  // --- Render ---

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Método Simplex</h1>
          <button type="button" onClick={() => navigate('/')}>Volver</button>
        </div>
        <div className="loading">Cargando datos del problema...</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Método Simplex</h1>
          <button type="button" onClick={() => navigate('/')}>Volver</button>
        </div>
        <div className="page-content">
          <div className="result-mensaje error">
            {loadError}
            <button onClick={handleRetry} className="btn-secondary btn-sm" style={{ marginLeft: 12 }}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Método Simplex</h1>
        <button type="button" onClick={() => navigate('/')}>Volver</button>
      </div>

      <div className="page-content">
        {serverError && (
          <div ref={errorRef} className="result-mensaje error" style={{ marginBottom: 20 }}>
            {serverError}
          </div>
        )}

        {/* 1. Información General */}
        <div className="form-section-card">
          <h2>Información general</h2>
          <section className="form-section">
          <FormInput
            label="Título *"
            type="text"
            placeholder="Ej: Problema de producción"
            value={form.titulo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
            error={errors['titulo']}
          />
          <div className="form-field">
            <label>Descripción</label>
            <textarea
              placeholder="Descripción opcional"
              value={form.descripcion}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
          </section>
        </div>

        {/* 2. Variables */}
        <div className="form-section-card">
          <h2>Variables</h2>
          <section className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="qty-vars" style={{ fontSize: 14, fontWeight: 500 }}>Cantidad:</label>
              <input
                id="qty-vars"
                type="number"
                min="2"
                max="20"
                value={form.variables.length}
                onChange={handleCantidadVariablesChange}
                style={{ width: 70, padding: '4px 8px' }}
                className="form-control"
              />
            </div>
          </div>
          {errors['variables'] && <div className="error-message">{errors['variables']}</div>}

          <div className="form-row">
            {form.variables.map(v => (
              <FormInput
                key={v.id}
                label={`Nombre para ${v.variable} *`}
                type="text"
                placeholder={`Ej: Producto ${v.nombre}`}
                value={v.nombre}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateVarName(v.id, e.target.value)}
                error={errors[`var_${v.id}`]}
              />
            ))}
          </div>
          </section>
        </div>

        {/* 3. Función Objetivo */}
        <div className="form-section-card">
          <h2>Función objetivo</h2>
          <section className="form-section">
          <div className="form-row">
            <FormSelect
              label="Objetivo"
              options={TIPO_OPTIONS}
              value={form.foTipo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm(prev => ({ ...prev, foTipo: e.target.value as Optimizacion }))}
            />
            {form.foTerminos.map(fo => {
              const variable = form.variables.find(v => v.id === fo.variableId)
              return (
                <NumericTextInput
                  key={fo.id}
                  label={`Coef. de ${variable?.variable} *`}
                  placeholder="0"
                  value={fo.coeficiente}
                  onChange={(v) => updateFOCoef(fo.variableId, v)}
                  error={errors[`fo_${fo.variableId}`]}
                />
              )
            })}
          </div>
          </section>
        </div>

        {/* 4. Restricciones */}
        <div className="form-section-card">
          <h2>Restricciones</h2>
          <section className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
            <button type="button" className="btn-secondary btn-sm" onClick={addRestriccion}>
              + Agregar restricción
            </button>
          </div>

          {errors['restricciones'] && <div className="error-message">{errors['restricciones']}</div>}

          <div className="cards-grid">
            {form.restricciones.map((r, index) => (
              <div key={r.id} className="card">
                <div className="card-header">
                  <span className="card-label">Restricción {index + 1}</span>
                  {form.restricciones.length > 1 && (
                    <button type="button" className="btn-danger btn-sm" onClick={() => removeRestriccion(r.id)}>
                      Quitar
                    </button>
                  )}
                </div>
                <div className="card-row">
                  {r.coeficientes.map(c => {
                    const variable = form.variables.find(v => v.id === c.variableId)
                    return (
                      <NumericTextInput
                        key={c.id}
                        label={`Coef. ${variable?.variable}`}
                        placeholder="0"
                        value={c.coeficiente}
                        onChange={(v) => updateRestriccionCoef(r.id, c.variableId, v)}
                        error={errors[`restriccion_${r.id}_coef_${c.variableId}`]}
                        showInvalid={showFieldErrors && index === form.restricciones.length - 1 && c.coeficiente === ''}
                      />
                    )
                  })}
                  <FormSelect
                    label="Signo"
                    options={SIGNO_OPTIONS}
                    value={r.signo}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRestriccion(r.id, 'signo', e.target.value as Signo)}
                  />
                  <NumericTextInput
                    label="Constante"
                    placeholder="0"
                    value={r.constante}
                    onChange={(v) => updateRestriccionConstante(r.id, v)}
                    error={errors[`restriccion_${r.id}_constante`]}
                    showInvalid={showFieldErrors && index === form.restricciones.length - 1 && r.constante === ''}
                  />
                </div>
                <FormInput
                  label="Glosa (opcional)"
                  type="text"
                  placeholder="Ej: Horas de ensamble disponibles"
                  value={r.glosa}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateRestriccion(r.id, 'glosa', e.target.value)}
                />
              </div>
            ))}
          </div>
          </section>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" className="btn-primary" onClick={handleOpenSummary}>
            Revisar y Calcular
          </button>
        </div>
      </div>

      {/* 5. Modal de Resumen */}
      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
        title="Resumen del problema"
      >
        <div className="confirmacion">
          <div className="confirmacion-section">
            <h3>Información general</h3>
            <div className="confirmacion-text">
              <strong>Título:</strong> {form.titulo}
              {form.descripcion.trim() && (
                <>
                  <br />
                  <strong>Descripción:</strong> {form.descripcion}
                </>
              )}
            </div>
          </div>

          <div className="confirmacion-section">
            <h3>Variables ({form.variables.length})</h3>
            <div className="confirmacion-text">
              {form.variables.map(v => (
                <div key={v.id}>{v.variable} → {v.nombre}</div>
              ))}
            </div>
          </div>

          <div className="confirmacion-section">
            <h3>Función objetivo</h3>
            <div className="confirmacion-text" style={{ fontFamily: 'var(--mono)' }}>
              {formatFO()}
            </div>
          </div>

          <div className="confirmacion-section">
            <h3>Restricciones</h3>
            <div className="confirmacion-scroll">
              {form.restricciones.map((r, i) => (
                <div key={r.id} className="confirmacion-item">
                  {i + 1}. {formatRestriccion(r)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SummaryModal>
    </div>
  )
}
