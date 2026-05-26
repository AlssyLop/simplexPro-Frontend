export type Metodo = 'simplex' | 'grafico'

export type Optimizacion = 'max' | 'min'

export type Signo = '<=' | '>=' | '='

// ---------------------------------------------------------------------------
// Estado interno del formulario (UI state)
// ---------------------------------------------------------------------------

export interface SimplexVariable {
  id: string
  /** Clave generada: x1, x2, ..., xn */
  variable: string
  nombre: string
}

export interface FOTermino {
  id: string
  variableId: string
  coeficiente: string
}

export interface CoeficienteRestriccion {
  id: string
  variableId: string
  coeficiente: string
}

export interface SimplexRestriccion {
  id: string
  coeficientes: CoeficienteRestriccion[]
  signo: Signo
  constante: string
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

export interface GraficoRestriccion {
  id: string
  coefX: string
  coefY: string
  signo: Signo
  constante: string
  glosa: string
}

export interface GraficoFormData {
  titulo: string
  descripcion: string
  nombreX: string
  nombreY: string
  foTipo: Optimizacion
  foCoefX: string
  foCoefY: string
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

export interface ListadoProblemasResponse {
  problemas: ResumenProblema[]
  pagination: {
    totalItems: number
    pageSize: number
    totalPages: number
  }
}

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
    foCoefX: '',
    foCoefY: '',
    restricciones: [],
  }
}

export function crearRestriccionGrafica(): GraficoRestriccion {
  return {
    id: generarId(),
    coefX: '',
    coefY: '',
    signo: '<=',
    constante: '',
    glosa: '',
  }
}

// ---------------------------------------------------------------------------
// Helpers para inicializar/modificar la estructura
// ---------------------------------------------------------------------------

export function inicializarRestriccion(variables: SimplexVariable[]): SimplexRestriccion {
  return {
    id: generarId(),
    coeficientes: variables.map((v) => ({
      id: generarId(),
      variableId: v.id,
      coeficiente: '',
    })),
    signo: '<=',
    constante: '',
    glosa: '',
  }
}

export function inicializarVariables(count: number): { variables: SimplexVariable[], foTerminos: FOTermino[] } {
  const variables: SimplexVariable[] = []
  const foTerminos: FOTermino[] = []
  
  for (let i = 0; i < count; i++) {
    const varId = generarId()
    variables.push({
      id: varId,
      variable: `x${i + 1}`,
      nombre: '',
    })
    foTerminos.push({
      id: generarId(),
      variableId: varId,
      coeficiente: '',
    })
  }

  return { variables, foTerminos }
}

export function parseNumericString(s: string): number {
  return s === '' ? NaN : Number(s.replace(',', '.'))
}

// ---------------------------------------------------------------------------
// Mapeo de API → FormData (para edición)
// ---------------------------------------------------------------------------

export function mapApiToGraficoFormData(res: ProblemaGraficoEditable): GraficoFormData {
  const titulo = res.titulo
  const descripcion = res.descripcion ?? ''
  const nombreX = res.variables.x
  const nombreY = res.variables.y
  const foTipo = res.funcion_objetivo.tipo
  const foCoefX = String(res.funcion_objetivo.x)
  const foCoefY = String(res.funcion_objetivo.y)
  const restricciones = res.restricciones.map((r) => ({
    id: generarId(),
    coefX: String(r.x),
    coefY: String(r.y),
    signo: r.signo,
    constante: String(r.constante),
    glosa: r.glosa ?? '',
  }))
  return {
    titulo,
    descripcion,
    nombreX,
    nombreY,
    foTipo,
    foCoefX,
    foCoefY,
    restricciones,
  }
}

export function mapApiToSimplexFormData(res: ProblemaSimplexEditable): SimplexFormData {
  const titulo = res.titulo
  const descripcion = res.descripcion ?? ''
  const variables = Object.entries(res.variables).map(([key, value]) => ({
    id: generarId(),
    variable: key,
    nombre: value,
  }))
  const keyToId = new Map(variables.map(v => [v.variable, v.id]))
  const foTipo = res.funcion_objetivo.tipo
  const foTerminos = Object.entries(res.funcion_objetivo.terminos).map(([key, value]) => ({
    id: generarId(),
    variableId: keyToId.get(key) ?? key,
    coeficiente: String(value),
  }))
  const restricciones = res.restricciones.map((r) => ({
    id: generarId(),
    coeficientes: Object.entries(r.terminos).map(([key, value]) => ({
      id: generarId(),
      variableId: keyToId.get(key) ?? key,
      coeficiente: String(value),
    })),
    signo: r.signo,
    constante: String(r.constante),
    glosa: r.glosa ?? '',
  }))
  return {
    titulo,
    descripcion,
    variables,
    foTipo,
    foTerminos,
    restricciones
  }
}