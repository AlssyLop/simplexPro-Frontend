# Spec: Edición de Problemas Existentes

**Proyecto:** SimplexPro Frontend  
**Fecha:** 2026-05-19  
**Estado:** Borrador aprobado  
**Autor:** Definida mediante sesión spec-builder

---

## 1. Contexto

Actualmente un usuario puede crear problemas (método gráfico o simplex), ver su resultado y eliminarlos desde el dashboard. Sin embargo, no hay forma de corregir o modificar los datos de un problema ya creado. Si el usuario ingresó mal un coeficiente, un nombre de variable o el título, debe eliminar el problema y volver a crearlo desde cero.

Esta especificación agrega la funcionalidad de **editar** un problema existente, reutilizando los formularios de registro con los datos precargados y llamando al endpoint de actualización del backend.

---

## 2. Rutas

| Acción   | Ruta                               |
|----------|------------------------------------|
| Editar gráfico | `/editar/problema/{id}/grafico` |
| Editar simplex | `/editar/problema/{id}/simplex` |

Cada ruta es una pantalla independiente. No existe una pantalla compartida que cambie según el método.

---

## 3. Flujo completo

1. El usuario está en la **vista de resultado** de un problema.
2. Hace clic en el botón **"Editar"** que se encuentra en la vista de resultado.
3. El sistema redirige al formulario de edición correspondiente según el método del problema.
4. El formulario se muestra con **todos los campos precargados** con los datos actuales del problema.
5. El usuario modifica los campos que desee.
6. Hace clic en **"Revisar y Calcular"**.
7. Se abre el panel de resumen con los datos modificados.
8. Confirma haciendo clic en **"Calcular"**.
9. El formulario envía los datos al endpoint de actualización.
10. Si la actualización es exitosa, el usuario es redirigido a la vista de resultado con los datos actualizados.

---

## 4. Punto de entrada — Botón "Editar"

### 4.1 Ubicación

- La vista de resultado (método gráfico y método simplex) debe mostrar un botón **"Editar"** en la cabecera de la página.
- Se coloca junto al botón "Volver".

### 4.2 Comportamiento

- Al hacer clic, redirige a la ruta de edición correspondiente:
  - Método gráfico → `/editar/problema/{id}/grafico`
  - Método simplex → `/editar/problema/{id}/simplex`
- No requiere confirmación previa.

---

## 5. Carga de datos para edición

### 5.1 Obtención de datos

- Al entrar a la ruta de edición, el formulario carga los datos del problema desde el backend usando `GET /problemas/{id}/formulario`.
- Durante la carga se muestra un indicador de carga.
- No se muestran los campos del formulario hasta que los datos estén listos.

### 5.2 Método Gráfico

- **Response Body (Graphic Example)**:
  ```json
  {
    "titulo": "New Graphic Problem",
    "descripcion": "Optional description",
    "variables": { "x": "Product A", "y": "Product B" },
    "restricciones": [
      { "x": 2, "y": 3, "signo": "<=", "constante": 12, "glosa": "Constraint 1" }
    ],
    "funcion_objetivo": { "x": 10, "y": 15, "tipo": "max" }
  }
  ```

### 5.3 Método Simplex

- **Response Body (Simplex Example)**:
  ```json
  {
    "titulo": "New Simplex Problem",
    "descripcion": "Optimization of production resources",
    "variables": { "x1": "Var 1", "x2": "Var 2", "x3": "Var 3" },
    "restricciones": [
      {
        "terminos": {
          "x1": 1,
          "x2": 1,
          "x3": 1
        },
        "signo": "=",
        "constante": 50
      }
    ],
    "funcion_objetivo": {
      "terminos": {
          "x1": 1,
          "x2": 1,
          "x3": 1
        },
      "tipo": "min"
    }
  }
  ```

### 5.4 Manejo de errores de carga

- Si la carga falla (error de red), se muestra un mensaje de error con un botón **"Reintentar"**.
- Si el problema no existe (404), se muestra un mensaje: *"El problema que intentas editar no existe."*
- Si no se obtuvieron los datos del problema (404), se muestra un mensaje: *"No se pudo obtener el formulario."*

---

## 6. Formulario de edición

### 6.1 Reutilización de componentes

- Los formularios de edición reutilizan los **mismos componentes** que los formularios de creación (`RegistroGrafico` y `RegistroSimplex`).
- La diferencia es que el formulario recibe un `id` por ruta y carga los datos del problema.
- El botón **"Revisar y Calcular"** se conserva con el mismo texto y comportamiento visual, menos que en lugar de guardar el problema, se envia al endpoint de actualizar.

### 6.2 Campos editables

Son los mismos que en creación:

**Método Gráfico:**
- Título, descripción
- Nombre de variable `x`, nombre de variable `y`
- Tipo de optimización, coeficiente de `x`, coeficiente de `y`
- Restricciones (coeficientes, signo, constante, glosa) — se pueden agregar y quitar

**Método Simplex:**
- Título, descripción
- Cantidad de variables y nombres personalizados
- Tipo de optimización y coeficientes por variable
- Restricciones (coeficientes, signo, constante, glosa) — se pueden agregar y quitar

### 6.3 Lo que **no** se puede cambiar

- El **método** del problema (gráfico o simplex) no se puede modificar.
- La ruta de edición depende del método original.

### 6.4 Cantidad de variables en método Simplex

- El campo de cantidad de variables permite cambiar el número.
- Si se **aumenta** la cantidad, las nuevas variables aparecen con coeficiente `0` y nombre vacío.
- Si se **reduce** la cantidad, las variables sobrantes y sus coeficientes en restricciones y FO se eliminan.

---

## 7. Validaciones del lado del cliente

Son las **mismas** que en los formularios de creación (ver Spec: Formularios de Registro, sección 5).

---

## 8. Panel de resumen

### 8.1 Comportamiento

- Se abre al presionar **"Revisar y Calcular"**.
- Solo se abre si el formulario pasa todas las validaciones del lado del cliente.
- Muestra los datos **modificados** (no los originales).

### 8.2 Contenido

El panel muestra la misma información que en creación:

- Título y descripción.
- Tipo de optimización y función objetivo formateada.
- Lista de variables con nombres descriptivos.
- Lista de restricciones en formato de inecuación.

### 8.3 Botón de acción

- El botón dentro del panel se llama **"Calcular"** (mismo texto que en creación).
- Durante el envío muestra el mismo indicador de carga y se deshabilita.

---

## 9. Envío al servidor

### 9.1 Endpoint

```
PUT /problemas/actualizar?metodo=grafico&id={id}
PUT /problemas/actualizar?metodo=simplex&id={id}
```

### 9.2 Cuerpo del request

- **Request Body (Graphic Example)**:
  ```json
  {
    "titulo": "New Graphic Problem",
    "descripcion": "Optional description",
    "variables": { "x": "Product A", "y": "Product B" },
    "restricciones": [
      { "x": 2, "y": 3, "signo": "<=", "constante": 12, "glosa": "Constraint 1" }
    ],
    "funcion_objetivo": { "x": 10, "y": 15, "tipo": "max" }
  }
  ```

- **Request Body (Simplex Example)**:
  ```json
  {
    "titulo": "New Simplex Problem",
    "descripcion": "Optimization of production resources",
    "variables": { "x1": "Var 1", "x2": "Var 2", "x3": "Var 3" },
    "restricciones": [
      {
        "terminos": {
          "x1": 1,
          "x2": 1,
          "x3": 1
        },
        "signo": "=",
        "constante": 50
      }
    ],
    "funcion_objetivo": {
      "terminos": {
          "x1": 1,
          "x2": 1,
          "x3": 1
        },
      "tipo": "min"
    }
  }
  ```

### 9.3 Respuesta exitosa

```json
{ "mensaje": "Problema actualizado" }
```

- Al recibir esta respuesta, el usuario es redirigido a la vista de resultado del problema:
  - Método gráfico → `/problema/{id}/grafico`
  - Método simplex → `/problema/{id}/simplex`

### 9.4 Manejo de errores de envío

- **Error 400** (validación del backend): Se cierra el panel de resumen y el mensaje de error se muestra en un aviso visible en la parte superior del formulario.
- **Error 404**: *"El problema no existe. Puede que haya sido eliminado."*
- **Error 500**: *"Ocurrió un error al actualizar el problema."*
- **Error de red**: *"Error de conexión. Verifica tu red e intenta de nuevo."*

---

## 10. Integración con la API

### 10.1 Endpoints nuevos necesarios en el frontend

| Función                          | Método | Ruta                                              |
|----------------------------------|--------|---------------------------------------------------|
| `actualizarProblemaGrafico`      | PUT    | `/problemas/actualizar?metodo=grafico&id={id}`    |
| `actualizarProblemaSimplex`      | PUT    | `/problemas/actualizar?metodo=simplex&id={id}`    |

### 10.2 Payloads

Son los mismos que en creación (`ApiPayloadGrafico` y `ApiPayloadSimplex`).

---

## 11. Estados de la pantalla de edición

### 11.1 Carga (`loading`)

- Mensaje: *"Cargando datos del problema..."*
- No se muestra el formulario.

### 11.2 Error al cargar

- Mensaje de error con botón **"Reintentar"**.
- Si es 404: *"El problema que intentas editar no existe."*

### 11.3 Formulario listo

- Todos los campos precargados.
- El usuario puede editar libremente.

### 11.4 Error al enviar

- El panel de resumen se cierra.
- Mensaje de error general en la parte superior del formulario.
- El formulario conserva todos los datos modificados.

### 11.5 Éxito

- Redirección automática a la vista de resultado.

---

## 12. Fuera de alcance

- Editar el método del problema (cambiar de gráfico a simplex o viceversa).
- Vista previa de cambios sin enviar (borrador local).
- Historial de versiones del problema.
- Confirmación al salir del formulario de edición con cambios sin guardar.
- Permisos de usuario (todos los problemas son editables por cualquiera).
