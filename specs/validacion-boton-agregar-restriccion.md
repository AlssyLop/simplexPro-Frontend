# Spec: Validación del botón "+ Agregar restricción"

**Proyecto:** SimplexPro Frontend  
**Fecha:** 2026-05-23  
**Estado:** Borrador aprobado  
**Autor:** Definida mediante sesión spec-builder

---

## 1. Contexto

Actualmente los formularios de registro (método gráfico y simplex) permiten agregar restricciones sin validar si la restricción actual está completa. El usuario puede hacer clic repetidamente en "+ Agregar restricción" y crear múltiples tarjetas vacías o incompletas, lo que genera confusión y datos inválidos.

Esta especificación agrega una validación que impide agregar una nueva restricción hasta que la última restricción tenga sus datos obligatorios completos.

---

## 2. Comportamiento del botón

### 2.1 Estado inhabilitado

- El botón "+ Agregar restricción" se muestra **inhabilitado** (estilo visual gris/opaco, sin respuesta al clic) cuando la **última** tarjeta de restricción no tiene todos sus campos obligatorios completos.
- No se muestra un mensaje de error flotante ni un texto adicional. El cambio visual del botón (inhabilitado) es suficiente indicación para el usuario.

### 2.2 Estado habilitado

- El botón se **habilita** automáticamente cuando la última restricción tiene todos sus campos obligatorios completos.
- El usuario puede hacer clic para agregar una nueva restricción.

### 2.3 Después de agregar

- Al hacer clic en el botón habilitado, se agrega una nueva tarjeta de restricción vacía (valores por defecto).
- Inmediatamente después, el botón **vuelve a inhabilitarse** porque la nueva tarjeta está vacía.

---

## 3. Campos obligatorios por tipo de formulario

### 3.1 Método Gráfico

Una restricción se considera completa cuando todos los siguientes campos tienen un valor numérico válido y distinto de cero:

- Coeficiente de `x`
- Coeficiente de `y`
- Signo (tiene valor por defecto, siempre es válido)
- Constante

La **glosa** es opcional y no afecta el estado del botón.

### 3.2 Método Simplex

Una restricción se considera completa cuando todos los siguientes campos tienen un valor numérico válido y distinto de cero:

- Coeficiente de cada variable (x1, x2, ..., xn)
- Signo (tiene valor por defecto, siempre es válido)
- Constante

La **glosa** es opcional y no afecta el estado del botón.

---

## 4. Definición de "completo"

Un campo numérico se considera **completo** si:

- No es `NaN` (no está vacío después de editar).
- Su valor absoluto es mayor que `0`.

Un campo de texto (glosa) se considera **siempre completado** (nunca bloquea).

---

## 5. Alcance

### 5.1 Aplica a

- Formulario de registro — Método Gráfico (`/registrar/problema/grafico`)
- Formulario de registro — Método Simplex (`/registrar/problema/simplex`)
- Formulario de edición — Método Gráfico (`/editar/problema/{id}/grafico`)
- Formulario de edición — Método Simplex (`/editar/problema/{id}/simplex`)

### 5.2 Modo edición

- Si el usuario carga un problema existente para editar, las restricciones vienen precargadas con datos completos.
- En ese caso, el botón se **habilita** inmediatamente después de la carga.
- Si el usuario borra los datos de la última restricción (la deja incompleta), el botón se **inhabilitará** hasta que los complete nuevamente.

---

## 6. Regla de validación (pseudocódigo)

```
function ultimaRestriccionCompleta(restricciones):
  si no hay restricciones:
    devolver verdadero  # el botón se habilita

  ultima = restricciones[última]

  para cada campo numérico obligatorio en ultima:
    si campo es NaN o campo === 0:
      devolver falso

  devolver verdadero
```

- Cuando `ultimaRestriccionCompleta` devuelve `falso` → botón inhabilitado.
- Cuando devuelve `verdadero` → botón habilitado.

---

## 7. Notas de implementación

- La validación se evalúa en cada render del formulario (reactivo), no solo al hacer clic.
- No se requiere estado adicional — se calcula a partir del estado existente del formulario.
- El botón usa el atributo `disabled` de HTML. El estilo visual del botón inhabilitado debe ser coherente con el resto de la interfaz.
