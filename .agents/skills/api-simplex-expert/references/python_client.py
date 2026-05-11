import httpx
from typing import List, Dict, Any, Optional

BASE_URL = "http://localhost:8000"

async def listar_problemas(page: int = 1) -> List[Dict[str, Any]]:
    """Obtiene la lista de problemas registrados."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/problema/listar", params={"page": page})
        response.raise_for_status()
        return response.json()

async def obtener_solucion_grafica(problema_id: str) -> Dict[str, Any]:
    """Obtiene la solución de un problema por el método gráfico."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/problema/solucion/grafica/{problema_id}")
        response.raise_for_status()
        return response.json()

async def obtener_solucion_simplex(problema_id: str) -> Dict[str, Any]:
    """Obtiene la solución de un problema por el método simplex."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/problema/solucion/simplex/{problema_id}")
        response.raise_for_status()
        return response.json()

async def registrar_problema(metodo: str, problema_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Registra un nuevo problema.
    metodo: 'grafico' o 'simplex'
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/problema/registrar",
            params={"metodo": metodo},
            json=problema_data
        )
        response.raise_for_status()
        return response.json()

async def actualizar_problema(metodo: str, problema_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Actualiza un problema existente.
    Debe incluir 'id' o 'problemaID' en problema_data.
    """
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"{BASE_URL}/problema/actualizar",
            params={"metodo": metodo},
            json=problema_data
        )
        response.raise_for_status()
        return response.json()

async def eliminar_problema(problema_id: str) -> Dict[str, str]:
    """Elimina un problema por su ID."""
    async with httpx.AsyncClient() as client:
        response = await client.delete(f"{BASE_URL}/problema/eliminar/{problema_id}")
        response.raise_for_status()
        return response.json()

async def exportar_pdf(problema_id: str, output_path: str):
    """Descarga el reporte PDF de un problema."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/problemas/{problema_id}/exportar")
        response.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(response.content)
    return output_path
