---
name: api-simplex-expert
description: Guía experta para el uso de la API REST de SimplexPro. Úsala cuando necesites implementar integraciones, gestionar peticiones (GET, POST, PUT, DELETE), entender los esquemas JSON de los modelos de Programación Lineal (Simplex/Gráfico), o utilizar funciones cliente en Python para interactuar con el servidor.
---

# SimplexPro API Expert

Esta skill capacita al asistente para manejar todas las operaciones de la API REST de SimplexPro, asegurando que los datos se envíen y reciban correctamente según los esquemas definidos.

## Recursos Disponibles
- **Cliente Python**: Funciones listas para usar en `references/python_client.py`.

## Resumen de Endpoints

### 1. Listar Problemas
- **Ruta**: `GET /problema/listar`
- **Query Params**: `page` (int, default=1).
- **Request JSON**: N/A
- **Response JSON**: `List[ResumenProblema]`
  - `id`: string (UUID)
  - `titulo`: string
  - `descripcion`: string (opcional)
  - `tipoOptimizacion`: "max" | "min"
  - `fechaCreacion`: string (YYYY-MM-DD)

### 2. Solución Gráfica
- **Ruta**: `GET /problema/solucion/grafica/{id}`
- **Response JSON**: `MostrarResultadoGrafico`
  - `variables`: `{ "x": "nombre", "y": "nombre" }`
  - `restricciones`: `List[{ "inecuacion": "2x + 3y <= 10", "glosa": "..." }]`
  - `valoresFO`: Lista de strings con coordenadas de vértices.
  - `grafico`: String Base64 de la imagen.

### 3. Solución Simplex
- **Ruta**: `GET /problema/solucion/simplex/{id}`
- **Response JSON**: `MostrarResultadoSimplex`
  - `variables`: Dict con nombres de variables (ej. `{ "x1": "prod1", "x2": "prod2" }`)
  - `iteraciones`: `List[Iteracion]`
    - `iteracion`: int
    - `entra`: string (var que entra a la base)
    - `sale`: string (var que sale de la base)
    - `tabla`: `{ "encabezado": [...], "filas": [...] }`
  - `valor_fo`: string (resultado final)

### 4. Registro y Actualización
- **POST**: `/problema/registrar?metodo=grafico|simplex`
- **PUT**: `/problema/actualizar?metodo=grafico|simplex`
- **Request JSON (Gráfico)**:
  ```json
  {
    "titulo": "string",
    "descripcion": "string",
    "variables": { "x": "string", "y": "string" },
    "restricciones": [
      { "x": float, "y": float, "signo": "<=|>=|=", "valor": float, "glosa": "string" }
    ],
    "funcion_objetivo": { "x": float, "y": float, "tipo": "max|min" }
  }
  ```
- **Request JSON (Simplex)**:
  ```json
  {
    "titulo": "string",
    "descripcion": "string",
    "variables": { "x1": "nombre1", "x2": "nombre2" },
    "restricciones": [
      { "x1": float, "x2": float, "signo": "<=|>=|=", "valor": float }
    ],
    "funcion_objetivo": { "x1": float, "x2": float, "tipo": "max|min" }
  }
  ```

## Mensajes de Validación y Errores
- **400 Bad Request**:
  - `"{clave} es requerido"`: Falta campo en el JSON.
  - `"La variable '{var}' es requerida"`: Falta 'x' o 'y' en gráfico.
  - `"Variable '{var}' no es valida"`: En simplex, las variables deben seguir el patrón `x1`, `x2`, etc.
  - `"signo no es valido"`: Para gráfico solo `<=`, `>=`.
  - `"Tipo de optimización inválido"`: Debe ser `max` o `min`.
- **404 Not Found**: `"Problema no encontrado"`.
- **500 Internal Server Error**: Errores inesperados en el servidor o generación de PDF.

## Guía de Implementación
1. **Validación Previa**: Siempre verifica que los coeficientes sean numéricos y que los nombres de las variables en las restricciones coincidan con los definidos en el objeto `variables`.
2. **Uso del Cliente**: Importa las funciones de `python_client.py` para realizar las llamadas asíncronas.
3. **Manejo de Errores**: Implementa bloques `try/except` capturando `httpx.HTTPStatusError` para manejar las respuestas no exitosas.
