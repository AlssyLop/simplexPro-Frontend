import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChangeEvent } from 'react'
import type {
  GraficoFormData,
  GraficoRestriccion,
  FormErrors,
  ApiPayloadGrafico,
  Signo,
  Optimizacion,
  ProblemaGraficoEditable,
} from '../types'
import {
  crearGraficoFormDataVacia,
  crearRestriccionGrafica,
  mapApiToGraficoFormData,
  parseNumericString,
} from '../types'
import {
  obtenerFormulario,
  registrarProblemaGrafico,
  actualizarProblemaGrafico,
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
// Validación del lado del cliente (Spec §5)
// ---------------------------------------------------------------------------

function validarFormulario(data: GraficoFormData): FormErrors {
  const errors: FormErrors = {}

  // Título requerido
  if (!data.titulo.trim()) {
    errors['titulo'] = 'El título es requerido'
  }

  // Nombres de variables requeridos
  if (!data.nombreX.trim()) {
    errors['nombreX'] = 'El nombre de la variable x es requerido'
  }
  if (!data.nombreY.trim()) {
    errors['nombreY'] = 'El nombre de la variable y es requerido'
  }

  // Coeficientes de FO deben ser numéricos válidos
  if (data.foCoefX === '' || isNaN(parseNumericString(data.foCoefX))) {
    errors['foCoefX'] = 'El coeficiente es requerido'
  }
  if (data.foCoefY === '' || isNaN(parseNumericString(data.foCoefY))) {
    errors['foCoefY'] = 'El coeficiente es requerido'
  }

  // Restricciones: al menos una
  if (data.restricciones.length === 0) {
    errors['restricciones'] = 'Debes agregar al menos una restricción'
  }

  // Validar cada restricción
  data.restricciones.forEach((r, i) => {
    if (r.coefX === '' || isNaN(parseNumericString(r.coefX))) {
      errors[`restriccion_${i}_coefX`] = 'Debe ser un número válido'
    }
    if (r.coefY === '' || isNaN(parseNumericString(r.coefY))) {
      errors[`restriccion_${i}_coefY`] = 'Debe ser un número válido'
    }
    if (r.constante === '' || isNaN(parseNumericString(r.constante))) {
      errors[`restriccion_${i}_constante`] = 'Debe ser un número válido'
    }
  })

  return errors
}

// ---------------------------------------------------------------------------
// Transformación de estado local → payload API (Spec §11)
// ---------------------------------------------------------------------------

function buildPayload(data: GraficoFormData): ApiPayloadGrafico {
  return {
    titulo: data.titulo.trim(),
    descripcion: data.descripcion.trim() || undefined,
    variables: {
      x: data.nombreX.trim(),
      y: data.nombreY.trim(),
    },
    funcion_objetivo: {
      x: parseNumericString(data.foCoefX),
      y: parseNumericString(data.foCoefY),
      tipo: data.foTipo,
    },
    restricciones: data.restricciones.map((r) => ({
      x: parseNumericString(r.coefX),
      y: parseNumericString(r.coefY),
      signo: r.signo,
      constante: parseNumericString(r.constante),
      glosa: r.glosa.trim() || undefined,
    })),
  }
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function RegistroGrafico() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const esEdicion = !!id

  const [form, setForm] = useState<GraficoFormData>(crearGraficoFormDataVacia())
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
        setForm(mapApiToGraficoFormData(res as ProblemaGraficoEditable))
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
      .then((res) => setForm(mapApiToGraficoFormData(res as ProblemaGraficoEditable)))
      .catch(() => setLoadError('No se pudieron cargar los datos del problema.'))
      .finally(() => setLoading(false))
  }

  // --- Helpers de actualización ---

  function updateField(field: keyof GraficoFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateNumericField(field: 'foCoefX' | 'foCoefY', raw: string) {
    setForm((prev) => ({ ...prev, [field]: raw }))
  }

  function updateRestriccion<K extends keyof GraficoRestriccion>(
    index: number,
    field: K,
    value: GraficoRestriccion[K],
  ) {
    setForm((prev) => {
      const copy = [...prev.restricciones]
      copy[index] = { ...copy[index], [field]: value }
      return { ...prev, restricciones: copy }
    })
  }

  function updateRestriccionNumero(
    index: number,
    field: 'coefX' | 'coefY' | 'constante',
    raw: string,
  ) {
    updateRestriccion(index, field, raw)
    if (index === form.restricciones.length - 1) {
      setShowFieldErrors(false)
    }
  }

  function addRestriccion() {
    if (!ultimaRestriccionCompleta()) {
      setShowFieldErrors(true)
      return
    }
    setShowFieldErrors(false)
    setForm((prev) => ({
      ...prev,
      restricciones: [...prev.restricciones, crearRestriccionGrafica()],
    }))
  }

  function removeRestriccion(index: number) {
    setForm((prev) => ({
      ...prev,
      restricciones: prev.restricciones.filter((_r, i) => i !== index),
    }))
  }

  function ultimaRestriccionCompleta(): boolean {
    if (form.restricciones.length === 0) return true
    const r = form.restricciones[form.restricciones.length - 1]
    return r.coefX !== '' && r.coefY !== '' && r.constante !== ''
  }

  // --- Abrir resumen (Spec §6.1): solo si pasa validación ---

  function handleOpenSummary() {
    setServerError('')
    const validationErrors = validarFormulario(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      setShowSummary(true)
    }
  }

  // --- Envío (Spec §6.4) ---

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const payload = buildPayload(form)
      if (id) {
        await actualizarProblemaGrafico(id, payload)
        navigate(`/problema/${id}/grafico`)
      } else {
        const result = await registrarProblemaGrafico(payload)
        navigate(`/problema/${result.id}/grafico`)
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

  // --- Helpers de formato para el resumen ---

  function formatFO(): string {
    const tipo = form.foTipo.toUpperCase()
    return `${tipo} Z = ${form.foCoefX || '?'}x + ${form.foCoefY || '?'}y`
  }

  function formatRestriccion(r: GraficoRestriccion): string {
    const signo = SIGNO_DISPLAY[r.signo] ?? r.signo
    const base = `${r.coefX || '?'}x + ${r.coefY || '?'}y ${signo} ${r.constante || '?'}`
    return r.glosa.trim() ? `${base} (${r.glosa.trim()})` : base
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
          <h1>Método Gráfico</h1>
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
          <h1>Método Gráfico</h1>
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
        <h1>Método Gráfico</h1>
        <button type="button" onClick={() => navigate('/')}>Volver</button>
      </div>

      <div className="page-content">
        {/* Error general del servidor (Spec §7) */}
        {serverError && (
          <div ref={errorRef} className="result-mensaje error" style={{ marginBottom: 20 }}>
            {serverError}
          </div>
        )}

        {/* ---- Sección: Información general (Spec §3.2) ---- */}
        <div className="form-section-card">
          <h2>Información general</h2>
          <section className="form-section">
          <FormInput
            label="Título *"
            type="text"
            placeholder="Ej: Producción de muebles"
            value={form.titulo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('titulo', e.target.value)}
            error={errors['titulo']}
          />
          <div className="form-field">
            <label>Descripción</label>
            <textarea
              placeholder="Descripción opcional del problema"
              value={form.descripcion}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField('descripcion', e.target.value)}
            />
          </div>
          </section>
        </div>

        {/* ---- Sección: Variables (Spec §3.1) ---- */}
        <div className="form-section-card">
          <h2>Variables</h2>
          <section className="form-section">
          <div className="form-row">
            <FormInput
              label="Nombre de x *"
              type="text"
              placeholder="Ej: Mesa"
              value={form.nombreX}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('nombreX', e.target.value)}
              error={errors['nombreX']}
            />
            <FormInput
              label="Nombre de y *"
              type="text"
              placeholder="Ej: Silla"
              value={form.nombreY}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('nombreY', e.target.value)}
              error={errors['nombreY']}
            />
          </div>
          </section>
        </div>

        {/* ---- Sección: Función objetivo (Spec §3.3) ---- */}
        <div className="form-section-card">
          <h2>Función objetivo</h2>
          <section className="form-section">
          <div className="form-row">
            <FormSelect
              label="Tipo"
              options={TIPO_OPTIONS}
              value={form.foTipo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, foTipo: e.target.value as Optimizacion }))
              }
            />
            <NumericTextInput
              label="Coeficiente de x *"
              placeholder="0"
              value={form.foCoefX}
              onChange={(v) => updateNumericField('foCoefX', v)}
              error={errors['foCoefX']}
            />
            <NumericTextInput
              label="Coeficiente de y *"
              placeholder="0"
              value={form.foCoefY}
              onChange={(v) => updateNumericField('foCoefY', v)}
              error={errors['foCoefY']}
            />
          </div>
          </section>
        </div>

        {/* ---- Sección: Restricciones (Spec §3.4) ---- */}
        <div className="form-section-card">
          <h2>Restricciones</h2>
          <section className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
            <button type="button" className="btn-secondary btn-sm" onClick={addRestriccion}>
              + Agregar restricción
            </button>
          </div>

          {errors['restricciones'] && (
            <div className="error-message">{errors['restricciones']}</div>
          )}

          <div className="cards-grid">
            {form.restricciones.map((r, i) => (
              <div key={r.id} className="card">
                <div className="card-header">
                  <span className="card-label">Restricción {i + 1}</span>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => removeRestriccion(i)}
                  >
                    Quitar
                  </button>
                </div>
                <div className="card-row">
                  <NumericTextInput
                    label="Coef. x"
                    placeholder="0"
                    value={r.coefX}
                    onChange={(v) => updateRestriccionNumero(i, 'coefX', v)}
                    error={errors[`restriccion_${i}_coefX`]}
                    showInvalid={showFieldErrors && i === form.restricciones.length - 1 && r.coefX === ''}
                  />
                  <NumericTextInput
                    label="Coef. y"
                    placeholder="0"
                    value={r.coefY}
                    onChange={(v) => updateRestriccionNumero(i, 'coefY', v)}
                    error={errors[`restriccion_${i}_coefY`]}
                    showInvalid={showFieldErrors && i === form.restricciones.length - 1 && r.coefY === ''}
                  />
                  <FormSelect
                    label="Signo"
                    options={SIGNO_OPTIONS}
                    value={r.signo}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      updateRestriccion(i, 'signo', e.target.value as Signo)
                    }
                  />
                  <NumericTextInput
                    label="Constante"
                    placeholder="0"
                    value={r.constante}
                    onChange={(v) => updateRestriccionNumero(i, 'constante', v)}
                    error={errors[`restriccion_${i}_constante`]}
                    showInvalid={showFieldErrors && i === form.restricciones.length - 1 && r.constante === ''}
                  />
                </div>
                <FormInput
                  label="Glosa (opcional)"
                  type="text"
                  placeholder="Ej: Límite de madera"
                  value={r.glosa}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateRestriccion(i, 'glosa', e.target.value)
                  }
                />
              </div>
            ))}
          </div>
          </section>
        </div>

        {/* Botón principal (Spec §6.1) */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" className="btn-primary" onClick={handleOpenSummary}>
            Revisar y Calcular
          </button>
        </div>
      </div>

      {/* ---- Panel de resumen (Spec §6) ---- */}
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
            <h3>Variables</h3>
            <div className="confirmacion-text">
              x → {form.nombreX || '(sin nombre)'}
              <br />
              y → {form.nombreY || '(sin nombre)'}
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
