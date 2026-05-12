import type { MostrarResultadoGrafico, MostrarResultadoSimplex, ResumenProblema } from '../types'

const API = ''

export async function listarProblemas(page = 1): Promise<ResumenProblema[]> {
  const res = await fetch(`${API}/problema/listar?page=${page}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function registrarProblema(
  metodo: 'simplex' | 'grafico',
  data: Record<string, unknown>,
): Promise<{ id: string }> {
  const res = await fetch(`${API}/problema/registrar?metodo=${metodo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function obtenerSolucionGrafica(id: string): Promise<MostrarResultadoGrafico> {
  const res = await fetch(`${API}/problema/solucion/grafica/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function obtenerSolucionSimplex(id: string): Promise<MostrarResultadoSimplex> {
  const res = await fetch(`${API}/problema/solucion/simplex/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
