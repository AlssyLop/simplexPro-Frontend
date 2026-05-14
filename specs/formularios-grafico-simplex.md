# Spec: Formularios de Registro — Método Gráfico y Simplex

**Proyecto:** SimplexPro Frontend  
**Fecha:** 2026-05-14  
**Estado:** Borrador aprobado  
**Autor:** Definida mediante sesión spec-builder

---

## 1. Contexto

Actualmente los formularios de registro de problemas están divididos en secciones (pasos), lo que obliga al usuario a navegar entre pantallas para completar el ingreso de datos. El objetivo de esta especificación es rediseñar ambos formularios para que:

- Cada método tenga su propia pantalla dedicada con una ruta única.
- Todos los campos sean visibles de inicio a fin en una sola pantalla (sin pasos paginados).
- Los campos numéricos admitan decimales (tipo `float`).
- Se muestren mensajes de validación inline, tanto del lado del cliente como errores devueltos por el servidor.
- Antes de enviar, se muestre un panel de resumen con la opción de confirmar o cancelar.

---

## 2. Rutas

| Método   | Ruta                            |
|----------|---------------------------------|
| Gráfico  | `/registrar/problema/grafico`   |
| Simplex  | `/registrar/problema/simplex`   |

Cada ruta es una pantalla independiente. No existe una pantalla compartida que cambie según el método.

---

## 3. Formulario — Método Gráfico

### 3.1 Variables

- El método gráfico **siempre** trabaja con exactamente **dos variables**: `x` e `y`.
- No se le pregunta al usuario cuántas variables quiere — los campos son fijos.

| Campo             | Tipo  | Descripción                       |
|-------------------|-------|-----------------------------------|
| Nombre de variable `x` | Texto | Nombre descriptivo. Ej: "Mesa" |
| Nombre de variable `y` | Texto | Nombre descriptivo. Ej: "Silla" |

### 3.2 Información general

| Campo       | Tipo  | Requerido | Descripción               |
|-------------|-------|-----------|---------------------------|
| Título      | Texto | Sí        | Nombre del problema        |
| Descripción | Texto | No        | Descripción opcional       |

### 3.3 Función objetivo

| Campo                  | Tipo             | Requerido | Descripción                        |
|------------------------|------------------|-----------|------------------------------------|
| Coeficiente de `x`     | Número decimal   | Sí        | Ej: `5.0`                          |
| Coeficiente de `y`     | Número decimal   | Sí        | Ej: `4.0`                          |
| Tipo de optimización   | Selección (`max` / `min`) | Sí | Define si se maximiza o minimiza |

### 3.4 Restricciones

- El usuario puede **agregar** o **quitar** restricciones con botones dedicados.
- Debe haber al menos **una restricción**.
- Cada restricción contiene:

| Campo               | Tipo                      | Requerido | Descripción                          |
|---------------------|---------------------------|-----------|--------------------------------------|
| Coeficiente de `x`  | Número decimal            | Sí        | Ej: `2.0`                            |
| Coeficiente de `y`  | Número decimal            | Sí        | Ej: `1.0`                            |
| Signo               | Selección (`<=` / `>=`)   | Sí        | Solo estos dos signos en gráfico     |
| Valor constante     | Número decimal            | Sí        | Ej: `10.0`                           |
| Glosa / Etiqueta    | Texto                     | No        | Ej: "Límite de madera"               |

> **Regla de negocio:** El método gráfico no admite el signo `=` en las restricciones.

---

## 4. Formulario — Método Simplex

### 4.1 Variables

- El usuario **define cuántas variables** quiere usar antes de ver los campos de restricciones y función objetivo.
- Las claves de las variables siguen el patrón `x1`, `x2`, ..., `xn` — generadas automáticamente por el formulario.
- Número mínimo de variables: **2**.

| Campo                        | Tipo                    | Descripción                               |
|------------------------------|-------------------------|-------------------------------------------|
| Cantidad de variables        | Número entero           | Define cuántos campos de variable aparecen|
| Nombre de `x1`, `x2`, ..., `xn` | Texto por variable  | Nombre descriptivo por variable           |

### 4.2 Información general

| Campo       | Tipo  | Requerido | Descripción       |
|-------------|-------|-----------|-------------------|
| Título      | Texto | Sí        | Nombre del problema|
| Descripción | Texto | No        | Descripción opcional|

### 4.3 Función objetivo

Por cada variable `x1..xn` definida:

| Campo                | Tipo                      | Requerido | Descripción |
|----------------------|---------------------------|-----------|-------------|
| Coeficiente de `xi`  | Número decimal            | Sí        | Ej: `10.0`  |
| Tipo de optimización | Selección (`max` / `min`) | Sí        |             |

### 4.4 Restricciones

- El usuario puede **agregar** o **quitar** restricciones.
- Debe haber al menos **una restricción**.
- Cada restricción contiene un coeficiente por cada variable definida, más:

| Campo                           | Tipo                           | Requerido | Descripción |
|---------------------------------|--------------------------------|-----------|-------------|
| Coeficiente de `xi` (por variable) | Número decimal              | Sí        |             |
| Signo                           | Selección (`<=` / `>=` / `=`) | Sí        | Los tres signos son válidos en simplex |
| Valor constante                 | Número decimal                | Sí        |             |
| Glosa / Etiqueta                | Texto                         | No        |             |

---

## 5. Validaciones del lado del cliente

Las validaciones se ejecutan al intentar abrir el panel de resumen (antes de enviar).  
Los mensajes de error aparecen **justo debajo del campo** que falló.

### Reglas comunes (ambos métodos)

| Campo                | Regla                                              |
|----------------------|----------------------------------------------------|
| Título               | Requerido, no vacío                                |
| Nombre de variable   | Requerido, no vacío por cada variable              |
| Coeficiente numérico | Requerido, debe ser un número decimal válido       |
| Signo de restricción | Requerido, debe ser uno de los valores permitidos  |
| Valor constante      | Requerido, debe ser un número                      |
| Tipo de optimización | Requerido, debe ser `max` o `min`                  |

### Reglas específicas — Método Gráfico

| Condición                      | Mensaje de error                               |
|--------------------------------|------------------------------------------------|
| Sin restricciones              | "Debes agregar al menos una restricción"       |
| Signo diferente a `<=` o `>=` | "El método gráfico solo admite ≤ y ≥"          |

### Reglas específicas — Método Simplex

| Condición               | Mensaje de error                          |
|-------------------------|-------------------------------------------|
| Cantidad de variables < 2 | "Se requieren al menos 2 variables"     |
| Sin restricciones       | "Debes agregar al menos una restricción"  |

---

## 6. Panel de resumen

Antes de enviar el formulario al servidor, se muestra un **panel de resumen** con toda la información ingresada.

### 6.1 Apertura

- Se abre al presionar el botón principal al final del formulario.
- Solo se abre si el formulario pasa **todas** las validaciones del lado del cliente.
- Si hay errores de validación, el panel no se abre y los errores se muestran en el formulario.

### 6.2 Cierre

- Contiene un ícono **"×"** en la esquina superior derecha.
- Al cerrarlo, el usuario regresa al formulario con **todos los datos intactos**.
- No se envía ningún dato al servidor al cerrar.

### 6.3 Contenido del resumen

El panel muestra, de forma legible y organizada:

- Título y descripción del problema.
- Tipo de optimización y función objetivo en texto (ej: `MAX Z = 5x + 4y`).
- Lista de variables con sus nombres descriptivos.
- Lista de restricciones en formato de inecuación (ej: `2x + 1y ≤ 10 — Límite de madera`).

### 6.4 Acción de envío

- El panel contiene un botón **"Calcular"** que realiza el `POST` al servidor.
- Durante el envío:
  - El botón muestra un indicador de carga.
  - El botón queda deshabilitado para evitar doble envío.
- Si el servidor responde con **error**, el panel se cierra y el error se muestra en el formulario.
- Si el servidor responde con **éxito**, el usuario es redirigido a la pantalla de resultado.

---

## 7. Errores del servidor

### Error 400 (validación)

- Se muestra el mensaje del campo `detail` de la respuesta JSON.
- Si el error es atribuible a un campo específico, se muestra **debajo de ese campo**.
- Si el error es general (ej: `"Metodo no valido"`), se muestra en un **aviso visible en la parte superior del formulario**.

### Error 500 (servidor)

- Se muestra un aviso general: *"Ocurrió un error al resolver el problema. Intenta de nuevo."*

---

## 8. Flujo post-envío exitoso

Al recibir una respuesta exitosa (`{ "id": "uuid" }`):

- El usuario es **redirigido automáticamente** a la pantalla de resultado del problema:
  - Método gráfico → `/problemas/{id}/grafica`
  - Método simplex → `/problemas/{id}/simplex`

---

## 9. Persistencia

- Los formularios **no guardan** el progreso si el usuario recarga o cierra la pantalla.
- No existe funcionalidad de autoguardado ni borrador.

---

## 10. Estilo visual

- El estilo de ambos formularios debe ser **coherente** con el resto de la aplicación.
- Los formularios son **únicamente para crear** nuevos problemas — no soportan edición.
- No se requiere confirmación para quitar una restricción individual.

---

## 11. Integración con la API

### Endpoint

```
POST /problemas/registrar?metodo=grafico
POST /problemas/registrar?metodo=simplex
```

### Cuerpo del request — Método Gráfico

```json
{
  "titulo": "string",
  "descripcion": "string (opcional)",
  "variables": { "x": "Nombre X", "y": "Nombre Y" },
  "funcion_objetivo": { "x": 5.0, "y": 4.0, "tipo": "max" },
  "restricciones": [
    { "x": 2.0, "y": 1.0, "signo": "<=", "valor": 10.0, "glosa": "string (opcional)" }
  ]
}
```

### Cuerpo del request — Método Simplex

```json
{
  "titulo": "string",
  "descripcion": "string (opcional)",
  "variables": { "x1": "Nombre 1", "x2": "Nombre 2" },
  "funcion_objetivo": { "x1": 10.0, "x2": 15.0, "tipo": "max" },
  "restricciones": [
    { "x1": 1.0, "x2": 1.0, "signo": "<=", "valor": 50.0, "glosa": "string (opcional)" }
  ]
}
```

### Respuesta exitosa

```json
{ "id": "uuid-string" }
```

> Todos los coeficientes se envían como `float`, no como enteros.

---

## 12. Fuera de alcance

- Edición de problemas existentes desde el formulario.
- Eliminación de problemas.
- Exportación a PDF desde el formulario.
- Guardado de borradores.
- Autenticación o permisos de usuario.
