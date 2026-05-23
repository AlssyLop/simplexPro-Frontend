import type {
  ApiPayloadGrafico,
  ApiPayloadSimplex,
  ListadoProblemasResponse,
  MostrarResultadoGrafico,
  MostrarResultadoSimplex,
  ProblemaGraficoEditable,
  ProblemaSimplexEditable,
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

export async function listarProblemas(page: number): Promise<ListadoProblemasResponse> {
  const res = await fetch(`${API}/problemas?page=${page}`)
  return handleResponse<ListadoProblemasResponse>(res)
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

export async function obtenerFormulario(id: string): Promise<ProblemaGraficoEditable | ProblemaSimplexEditable> {
  const res = await fetch(`${API}/problemas/${id}/formulario`)
  return await handleResponse<ProblemaGraficoEditable | ProblemaSimplexEditable>(res)
}

export async function actualizarProblemaGrafico(
  id: string,
  payload: ApiPayloadGrafico,
): Promise<{ mensaje: string }> {
  const res = await fetch(`${API}/problemas/actualizar?metodo=grafico&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<{ mensaje: string }>(res)
}

export async function actualizarProblemaSimplex(
  id: string,
  payload: ApiPayloadSimplex,
): Promise<{ mensaje: string }> {
  const res = await fetch(`${API}/problemas/actualizar?metodo=simplex&id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<{ mensaje: string }>(res)
}

export async function obtenerSolucionGrafica(id: string): Promise<MostrarResultadoGrafico> {
  const res = await fetch(`${API}/problemas/${id}`)
  return handleResponse<MostrarResultadoGrafico>(res)
}

export async function obtenerSolucionSimplex(id: string): Promise<MostrarResultadoSimplex> {
  const res = await fetch(`${API}/problemas/${id}`)
  return handleResponse<MostrarResultadoSimplex>(res)
}

export async function eliminarProblema(id: string): Promise<void> {
  const res = await fetch(`${API}/problemas/eliminar/${id}`, { method: 'DELETE' })
  await handleResponse<{ mensaje: string }>(res)
}
