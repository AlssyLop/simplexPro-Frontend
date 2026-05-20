export type Metodo = 'simplex' | 'grafico'

export type Optimizacion = 'max' | 'min'

export type Signo = '<=' | '>=' | '='

// ---------------------------------------------------------------------------
// Estado interno del formulario (UI state)
// ---------------------------------------------------------------------------

export interface SimplexVariable {
  id: string
  /** Clave generada: x1, x2, ..., xn */
  nombre: string
  nombrePersonalizado: string
}

export interface FOTermino {
  id: string
  variableId: string
  coeficiente: number
}

export interface CoeficienteRestriccion {
  id: string
  variableId: string
  coeficiente: number
}

export interface SimplexRestriccion {
  id: string
  coeficientes: CoeficienteRestriccion[]
  signo: Signo
  constante: number
  glosa: string
}

export interface SimplexFormData {
  titulo: string
  descripcion: string
  variables: SimplexVariable[]
  foTipo: Optimizacion
  foTerminos: FOTermino[]
  restricciones: SimplexRestriccion[]
}

export interface GraficoFormData {
  titulo: string
  descripcion: string
  nombreX: string
  nombreY: string
  foTipo: Optimizacion
  foCoefX: number
  foCoefY: number
  restricciones: GraficoRestriccion[]
  }

export interface GraficoRestriccion {
  id: string
  coefX: number
  coefY: number
  signo: Signo
  constante: number
  glosa: string
}

export interface GraficoFormData {
  titulo: string
  descripcion: string
  nombreX: string
  nombreY: string
  foTipo: Optimizacion
  foCoefX: number
  foCoefY: number
  restricciones: GraficoRestriccion[]
}

// ---------------------------------------------------------------------------
// Payloads para la API  (POST /problemas/registrar)
// ---------------------------------------------------------------------------

export interface ApiTermino {
  coeficiente: number
  variable: string
}

export interface ApiRestriccionGrafico {
  x: number
  y: number
  signo: Signo
  constante: number
  glosa?: string
}

export interface ApiFuncionObjetivoGrafico {
  x: number
  y: number
  tipo: Optimizacion
}

export interface ApiPayloadGrafico {
  titulo: string
  descripcion?: string
  variables: { x: string; y: string }
  funcion_objetivo: ApiFuncionObjetivoGrafico
  restricciones: ApiRestriccionGrafico[]
}

export interface ApiRestriccionSimplex {
  terminos: Record<string, number>
  signo: Signo
  constante: number
  glosa?: string
}

export interface ApiFuncionObjetivoSimplex {
  terminos: Record<string, number>
  tipo: Optimizacion
}

export interface ApiPayloadSimplex {
  titulo: string
  descripcion?: string
  variables: Record<string, string>
  funcion_objetivo: ApiFuncionObjetivoSimplex
  restricciones: ApiRestriccionSimplex[]
}

// ---------------------------------------------------------------------------
// Datos editables (GET /problemas/{id} para cargar en formulario)
// ---------------------------------------------------------------------------

export interface ProblemaGraficoEditable {
  titulo: string
  descripcion: string | null
  variables: { x: string; y: string }
  funcion_objetivo: ApiFuncionObjetivoGrafico
  restricciones: ApiRestriccionGrafico[]
}

export interface ProblemaSimplexEditable {
  titulo: string
  descripcion: string | null
  variables: Record<string, string>
  funcion_objetivo: ApiFuncionObjetivoSimplex
  restricciones: ApiRestriccionSimplex[]
}

// ---------------------------------------------------------------------------
// Errores de validación
// ---------------------------------------------------------------------------

/** Mapa de campo → mensaje. Clave '' = error general de formulario. */
export type FormErrors = Record<string, string>

export interface ApiError {
  detail: string
}

// ---------------------------------------------------------------------------
// Respuestas de la API (GET)
// ---------------------------------------------------------------------------

export interface ResumenProblema {
  id: string
  titulo: string
  descripcion: string | null
  tipoOptimizacion: 'MAX' | 'MIN'
  metodo: string
  fechaCreacion: string
}

export interface MostrarResultadoGrafico {
  id: string
  titulo: string
  descripcion: string | null
  tipoOptimizacion: 'MAX' | 'MIN'
  metodo: string
  fechaCreacion: string
  funcion_objetivo: string
  mensaje: string
  valoresFO: string[]
  grafico: string
  variables: Record<string, string>
  restricciones: { inecuacion: string; glosa: string | null }[]
}

export interface IteracionSimplex {
  iteracion: number
  entra: string
  sale: string
  razonMinima: number
  elementoPivote: number
  tabla: Record<string, string[]>
}

export interface MostrarResultadoSimplex {
  id: string
  titulo: string
  descripcion: string | null
  tipoOptimizacion: 'MAX' | 'MIN'
  metodo: string
  fechaCreacion: string
  funcion_objetivo: string
  mensaje: string
  valorFO: string
  variables: Record<string, string>
  restricciones: { inecuacion: string; glosa: string | null }[]
  iteraciones: IteracionSimplex[]
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

let _idContador = 0
export function generarId(): string {
  return `id-${++_idContador}`
}

export function crearSimplexFormDataVacia(): SimplexFormData {
  return {
    titulo: '',
    descripcion: '',
    variables: [],
    foTipo: 'max',
    foTerminos: [],
    restricciones: [],
  }
}

export function crearGraficoFormDataVacia(): GraficoFormData {
  return {
    titulo: '',
    descripcion: '',
    nombreX: '',
    nombreY: '',
    foTipo: 'max',
    foCoefX: 0,
    foCoefY: 0,
    restricciones: [],
  }
}

export function crearRestriccionGrafica(): GraficoRestriccion {
  return {
    id: generarId(),
    coefX: 0,
    coefY: 0,
    signo: '<=',
    constante: 0,
    glosa: '',
  }
}

export function crearRestriccionSimplex(variables: SimplexVariable[]): SimplexRestriccion {
  return {
    id: generarId(),
    coeficientes: variables.map((v) => ({
      id: generarId(),
      variableId: v.id,
      coeficiente: 0,
    })),
    signo: '<=',
    constante: 0,
    glosa: '',
  }
}

// ---------------------------------------------------------------------------
// Mapeo de API → FormData (para edición)
// ---------------------------------------------------------------------------

const FO_PARSE = /^(MAX|MIN)\s+Z\s*=\s*(-?\d+(?:\.\d+)?)\s*x\s*([+-])\s*(\d+(?:\.\d+)?)\s*y$/
const REST_PARSE = /^([+-]?\d+(?:\.\d+)?)\s*x\s*([+-])\s*(\d+(?:\.\d+)?)\s*y\s*(<=|>=|=)\s*(\d+(?:\.\d+)?)$/

function parseFO(fo: string, tipoOptimizacion: 'MAX' | 'MIN'): { foTipo: Optimizacion; foCoefX: number; foCoefY: number } {
  const m = fo.match(FO_PARSE)
  if (m) {
    return {
      foTipo: m[1] === 'MIN' ? 'min' : 'max',
      foCoefX: Number(m[2]),
      foCoefY: m[3] === '-' ? -Number(m[4]) : Number(m[4]),
    }
  }
  return { foTipo: tipoOptimizacion === 'MIN' ? 'min' : 'max', foCoefX: 0, foCoefY: 0 }
}

function parseRestriccion(inecuacion: string, glosa: string | null): GraficoRestriccion {
  const m = inecuacion.match(REST_PARSE)
  if (m) {
    const coefY = m[2] === '-' ? -Number(m[3]) : Number(m[3])
    return {
      id: generarId(),
      coefX: Number(m[1]),
      coefY,
      signo: m[4] as Signo,
      constante: Number(m[5]),
      glosa: glosa ?? '',
    }
  }
  return crearRestriccionGrafica()
}

export function mapApiToGraficoFormData(res: MostrarResultadoGrafico): GraficoFormData {
  const { foTipo, foCoefX, foCoefY } = parseFO(res.funcion_objetivo, res.tipoOptimizacion)
  return {
    titulo: res.titulo,
    descripcion: res.descripcion ?? '',
    nombreX: res.variables.x,
    nombreY: res.variables.y,
    foTipo,
    foCoefX,
    foCoefY,
    restricciones: res.restricciones.map((r) => parseRestriccion(r.inecuacion, r.glosa)),
  }
}

const REST_SIMPLEX = /^(.*?)\s*(<=|>=|=)\s*(\d+(?:\.\d+)?)$/

function extractCoef(expr: string, key: string): number {
  const re = new RegExp(`([+-]?\\d+(?:\\.\\d+)?)\\s*${key}`)
  const m = expr.match(re)
  return m ? Number(m[1]) : 0
}

function parseRestriccionSimplex(
  inecuacion: string,
  _glosa: string | null,
  keys: string[],
): { terminos: Record<string, number>; signo: Signo; constante: number } {
  const m = inecuacion.match(REST_SIMPLEX)
  if (m) {
    const expr = m[1].trim()
    const terminos: Record<string, number> = {}
    for (const key of keys) {
      terminos[key] = extractCoef(expr, key)
    }
    return { terminos, signo: m[2] as Signo, constante: Number(m[3]) }
  }
  return { terminos: {}, signo: '<=' as Signo, constante: 0 }
}

export function mapApiToSimplexFormData(res: MostrarResultadoSimplex): SimplexFormData {
  const keys = Object.keys(res.variables).sort()
  const variables: SimplexVariable[] = keys.map((k) => ({
    id: generarId(),
    nombre: k,
    nombrePersonalizado: res.variables[k],
  }))

  const varPorNombre = new Map<string, string>()
  keys.forEach((k, i) => varPorNombre.set(k, variables[i].id))

  const foTipo: Optimizacion = res.tipoOptimizacion === 'MIN' ? 'min' : 'max'

  return {
    titulo: res.titulo,
    descripcion: res.descripcion ?? '',
    variables,
    foTipo,
    foTerminos: keys.map((k) => ({
      id: generarId(),
      variableId: varPorNombre.get(k)!,
      coeficiente: extractCoef(res.funcion_objetivo, k),
    })),
    restricciones: res.restricciones.map((r) => {
      const parsed = parseRestriccionSimplex(r.inecuacion, r.glosa, keys)
      return {
        id: generarId(),
        coeficientes: keys.map((k) => ({
          id: generarId(),
          variableId: varPorNombre.get(k)!,
          coeficiente: parsed.terminos[k] ?? 0,
        })),
        signo: parsed.signo,
        constante: parsed.constante,
        glosa: r.glosa ?? '',
      }
    }),
  }
}
