import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChangeEvent } from 'react'
import type {
  GraficoFormData,
  GraficoRestriccion,
  FormErrors,
  ApiPayloadGrafico,
  Signo,
  Optimizacion,
} from '../types'
import {
  crearGraficoFormDataVacia,
  crearRestriccionGrafica,
} from '../types'
import { registrarProblemaGrafico, ApiRequestError } from '../api/client'
import { FormInput } from '../components/FormInput'
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
  if (isNaN(data.foCoefX)) {
    errors['foCoefX'] = 'Debe ser un número válido'
  }
  if (isNaN(data.foCoefY)) {
    errors['foCoefY'] = 'Debe ser un número válido'
  }

  // Restricciones: al menos una
  if (data.restricciones.length === 0) {
    errors['restricciones'] = 'Debes agregar al menos una restricción'
  }

  // Validar cada restricción
  data.restricciones.forEach((r, i) => {
    if (isNaN(r.coefX)) {
      errors[`restriccion_${i}_coefX`] = 'Debe ser un número válido'
    }
    if (isNaN(r.coefY)) {
      errors[`restriccion_${i}_coefY`] = 'Debe ser un número válido'
    }
    if (isNaN(r.constante)) {
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
      x: data.foCoefX,
      y: data.foCoefY,
      tipo: data.foTipo,
    },
    restricciones: data.restricciones.map((r) => ({
      x: r.coefX,
      y: r.coefY,
      signo: r.signo,
      constante: r.constante,
      glosa: r.glosa.trim() || undefined,
    })),
  }
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function RegistroGrafico() {
  const navigate = useNavigate()
  const [form, setForm] = useState<GraficoFormData>(crearGraficoFormDataVacia)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Helpers de actualización ---

  function updateField(field: keyof GraficoFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateNumericField(field: 'foCoefX' | 'foCoefY', raw: string) {
    const parsed = raw === '' ? NaN : Number(raw)
    setForm((prev) => ({ ...prev, [field]: parsed }))
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
    const parsed = raw === '' ? NaN : Number(raw)
    updateRestriccion(index, field, parsed)
  }

  function addRestriccion() {
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
      const result = await registrarProblemaGrafico(payload)
      navigate(`/problema/${result.id}/grafico`)
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
    return `${tipo} Z = ${form.foCoefX}x + ${form.foCoefY}y`
  }

  function formatRestriccion(r: GraficoRestriccion): string {
    const signo = SIGNO_DISPLAY[r.signo] ?? r.signo
    const base = `${r.coefX}x + ${r.coefY}y ${signo} ${r.constante}`
    return r.glosa.trim() ? `${base} (${r.glosa.trim()})` : base
  }

  // --- Render ---

  return (
    <div className="page">
      <div className="page-header">
        <h1>Método Gráfico</h1>
        <button type="button" onClick={() => navigate('/')}>Volver</button>
      </div>

      <div className="page-content">
        {/* Error general del servidor (Spec §7) */}
        {serverError && (
          <div className="result-mensaje error" style={{ marginBottom: 20 }}>
            {serverError}
          </div>
        )}

        {/* ---- Sección: Información general (Spec §3.2) ---- */}
        <section className="form-section" style={{ marginBottom: 24 }}>
          <h2>Información general</h2>
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

        {/* ---- Sección: Variables (Spec §3.1) ---- */}
        <section className="form-section" style={{ marginBottom: 24 }}>
          <h2>Variables</h2>
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

        {/* ---- Sección: Función objetivo (Spec §3.3) ---- */}
        <section className="form-section" style={{ marginBottom: 24 }}>
          <h2>Función objetivo</h2>
          <div className="form-row">
            <FormSelect
              label="Tipo"
              options={TIPO_OPTIONS}
              value={form.foTipo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, foTipo: e.target.value as Optimizacion }))
              }
            />
            <FormInput
              label="Coeficiente de x *"
              type="number"
              step="any"
              placeholder="0"
              value={isNaN(form.foCoefX) ? '' : String(form.foCoefX)}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateNumericField('foCoefX', e.target.value)}
              error={errors['foCoefX']}
            />
            <FormInput
              label="Coeficiente de y *"
              type="number"
              step="any"
              placeholder="0"
              value={isNaN(form.foCoefY) ? '' : String(form.foCoefY)}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateNumericField('foCoefY', e.target.value)}
              error={errors['foCoefY']}
            />
          </div>
        </section>

        {/* ---- Sección: Restricciones (Spec §3.4) ---- */}
        <section className="form-section" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2>Restricciones</h2>
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
                  <FormInput
                    label="Coef. x"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={isNaN(r.coefX) ? '' : String(r.coefX)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateRestriccionNumero(i, 'coefX', e.target.value)
                    }
                    error={errors[`restriccion_${i}_coefX`]}
                  />
                  <FormInput
                    label="Coef. y"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={isNaN(r.coefY) ? '' : String(r.coefY)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateRestriccionNumero(i, 'coefY', e.target.value)
                    }
                    error={errors[`restriccion_${i}_coefY`]}
                  />
                  <FormSelect
                    label="Signo"
                    options={SIGNO_OPTIONS}
                    value={r.signo}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      updateRestriccion(i, 'signo', e.target.value as Signo)
                    }
                  />
                  <FormInput
                    label="Constante"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={isNaN(r.constante) ? '' : String(r.constante)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateRestriccionNumero(i, 'constante', e.target.value)
                    }
                    error={errors[`restriccion_${i}_constante`]}
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
