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
  lista_terminos: ApiTermino[]
  signo: Signo
  constante: number
  glosa?: string
}

export interface ApiFuncionObjetivoSimplex {
  lista_terminos: ApiTermino[]
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
  fechaCreacion: string
}

export interface MostrarResultadoGrafico {
  id: string
  titulo: string
  descripcion: string | null
  tipoOptimizacion: 'MAX' | 'MIN'
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
