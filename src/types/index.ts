export type Metodo = 'simplex' | 'grafico'

export type Optimizacion = 'max' | 'min'

export type Signo = '<=' | '>=' | '='

export type TipoVariable = 'entera' | 'no-entera'

export interface SimplexVariable {
  id: string
  nombre: string
  nombrePersonalizado: string
  tipo: TipoVariable
}

export interface FOTermino {
  id: string
  variableId: string
  coeficiente: number
}

export interface CoeficienteRestriccion {
  id: string
  variableId: string
  valor: number
}

export interface SimplexRestriccion {
  id: string
  coeficientes: CoeficienteRestriccion[]
  signo: Signo
  rhs: number
}

export interface SimplexFormData {
  titulo: string
  descripcion: string
  variables: SimplexVariable[]
  foTipo: Optimizacion
  foTerminos: FOTermino[]
  restricciones: SimplexRestriccion[]
}

export interface GraficoCoeficiente {
  id: string
  variable: 'x' | 'y'
  valor: number
}

export interface GraficoRestriccion {
  id: string
  coeficientes: GraficoCoeficiente[]
  signo: Signo
  rhs: number
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
  valor_fo: string
  variables: Record<string, string>
  restricciones: { inecuacion: string; glosa: string | null }[]
  iteraciones: IteracionSimplex[]
}

export let generarId: () => string
{
  let contador = 0
  generarId = () => `id-${++contador}`
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
    nombreX: 'x',
    nombreY: 'y',
    foTipo: 'max',
    foCoefX: 0,
    foCoefY: 0,
    restricciones: [],
  }
}
