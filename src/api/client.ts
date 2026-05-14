import type {
  ApiPayloadGrafico,
  ApiPayloadSimplex,
  MostrarResultadoGrafico,
  MostrarResultadoSimplex,
  ResumenProblema,
} from '../types'

const API = ''

// ---------------------------------------------------------------------------
// Error tipado para respuestas no-OK de la API
// ---------------------------------------------------------------------------

export class ApiRequestError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiRequestError'
    this.status = status
    this.detail = detail
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>

  let detail = `Error ${res.status}`
  try {
    const body = await res.json()
    if (typeof body?.detail === 'string') detail = body.detail
  } catch {
    // body no es JSON — usar el status como mensaje
  }
  throw new ApiRequestError(res.status, detail)
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function listarProblemas(page = 1): Promise<ResumenProblema[]> {
  const res = await fetch(`${API}/problemas?page=${page}`)
  const data = await handleResponse<{ problemas: ResumenProblema[] }>(res)
  return data.problemas
}

export async function registrarProblemaGrafico(
  payload: ApiPayloadGrafico,
): Promise<{ id: string }> {
  const res = await fetch(`${API}/problemas/registrar?metodo=grafico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<{ id: string }>(res)
}

export async function registrarProblemaSimplex(
  payload: ApiPayloadSimplex,
): Promise<{ id: string }> {
  const res = await fetch(`${API}/problemas/registrar?metodo=simplex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<{ id: string }>(res)
}

export async function obtenerSolucionGrafica(id: string): Promise<MostrarResultadoGrafico> {
  const res = await fetch(`${API}/problemas/${id}/grafica`)
  return handleResponse<MostrarResultadoGrafico>(res)
}

export async function obtenerSolucionSimplex(id: string): Promise<MostrarResultadoSimplex> {
  const res = await fetch(`${API}/problemas/${id}/simplex`)
  return handleResponse<MostrarResultadoSimplex>(res)
}

export async function eliminarProblema(id: string): Promise<void> {
  const res = await fetch(`${API}/problemas/eliminar/${id}`, { method: 'DELETE' })
  await handleResponse<{ mensaje: string }>(res)
}
