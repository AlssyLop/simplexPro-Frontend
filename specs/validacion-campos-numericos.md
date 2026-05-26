# Spec: Validación de campos numéricos como texto

**Proyecto:** SimplexPro Frontend  
**Fecha:** 2026-05-25  
**Estado:** Borrador aprobado  
**Autor:** Definida mediante sesión spec-builder

---

## 1. Contexto

Actualmente los formularios de registro y edición (método gráfico y simplex) usan `<input type="number">` para los campos de coeficientes y constantes. Esto tiene limitaciones: no acepta coma como separador decimal en algunos navegadores, permite caracteres no numéricos como `e` o `-` en posiciones inválidas, y no da control fino sobre el formato aceptado.

Esta especificación cambia esos campos a `<input type="text">` y agrega validación en tiempo real para aceptar solo números con un máximo de un separador decimal (punto o coma, pero no ambos).

---

## 2. Campos afectados

### 2.1 Método Gráfico

- Coeficiente de `x` en cada restricción
- Coeficiente de `y` en cada restricción
- Constante de cada restricción
- Coeficiente de `x` en la función objetivo
- Coeficiente de `y` en la función objetivo

### 2.2 Método Simplex

- Coeficiente de cada variable (`x1`, `x2`, ..., `xn`) en cada restricción
- Constante de cada restricción
- Coeficiente de cada variable (`x1`, `x2`, ..., `xn`) en la función objetivo

---

## 3. Comportamiento del campo de texto

### 3.1 Caracteres permitidos

- Dígitos: `0`-`9`
- Un solo separador decimal: **punto** `.` o **coma** `,`
- Signo negativo: `-` solo al inicio del valor
- Cualquier otro carácter se **rechaza** (no se escribe en el campo)

### 3.2 Validación del separador decimal

- Si el usuario escribe una **coma** y el valor ya contiene un **punto** → el campo se limpia completamente (en blanco).
- Si el usuario escribe un **punto** y el valor ya contiene una **coma** → el campo se limpia completamente (en blanco).
- Si el usuario escribe un segundo **punto** o **coma** (más de un separador del mismo tipo) → se rechaza el carácter (no se escribe).
- Si el usuario escribe una **coma** o **punto** **primero** seguido de un número (ej: `,5` o `.5`) → el campo se limpia completamente (en blanco).

### 3.3 Validación del signo negativo

- El signo `-` solo se permite como **primer carácter**.
- Si se intenta escribir `-` en otra posición → se rechaza el carácter (no se escribe).
- Si se escribe `-` al inicio seguido de separador decimal sin dígito (ej: `-,` o `-.`) → el campo se limpia completamente (en blanco).

### 3.4 Momento de la validación

- La validación ocurre **en tiempo real** (evento `onKeyDown` o `onBeforeInput`), evitando que el carácter inválido aparezca en el campo.
- No se muestra mensaje de error debajo del campo. El carácter simplemente no se escribe, o el campo se limpia si corresponde.

---

## 4. Conversión al enviar

Al enviar el formulario:

1. Si el valor contiene **coma** como separador decimal → se reemplaza por **punto** antes de convertir a número.
2. El valor limpio se parsea con `parseFloat()` para enviarlo al backend como número.

Esto aplica tanto para la creación como para la edición de problemas.

---

## 5. Alcance

### 5.1 Aplica a

- Formulario de registro — Método Gráfico (`/registrar/problema/grafico`)
- Formulario de registro — Método Simplex (`/registrar/problema/simplex`)
- Formulario de edición — Método Gráfico (`/editar/problema/{id}/grafico`)
- Formulario de edición — Método Simplex (`/editar/problema/{id}/simplex`)
- Componente `FormInput` si se reutiliza; o bien el input directo en cada formulario.

### 5.2 No aplica a

- Campo de glosa (sigue siendo texto libre).
- Campo de signo (`select` nativo, no requiere cambio).
- Cualquier otro campo que no sea numérico en los formularios.

---

## 6. Reglas de validación (pseudocódigo)

```
function validarYFiltrar(valorActual, nuevoCaracter):
    si nuevoCaracter es dígito:
        permitir

    si nuevoCaracter es '-':
        si posicionCursor === 0:
            permitir
        sino:
            rechazar

    si nuevoCaracter es '.' o ',':
        si valorActual contiene '.' o ',':
            // mezcla de separadores o duplicado
            limpiar campo a ""
        sino si nuevoCaracter está al inicio (valorActual vacío):
            limpiar campo a ""
        sino:
            permitir (primer separador decimal válido)

    cualquier otro caracter:
        rechazar
```

---

## 7. Notas de implementación

- Se recomienda manejar la validación en el evento `onKeyDown` para prevenir la escritura del carácter inválido antes de que aparezca en el campo.
- Alternativamente, se puede usar `onBeforeInput` con `e.preventDefault()`.
- No se requiere estado adicional — la validación se calcula a partir del valor actual del campo y el carácter que se intenta escribir.
- El tipo de campo cambia de `"number"` a `"text"`, con `inputMode="decimal"` para sugerir teclado numérico en dispositivos móviles.
- Los valores en el estado del formulario se mantienen como string hasta el momento de enviar, donde se convierten a número.
