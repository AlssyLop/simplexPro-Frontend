---
name: spec-builder
description: Guía paso a paso para crear una especificación de software a partir de una historia de desarrollador. Usar cuando el usuario entregue una historia de usuario o requerimientos en lenguaje natural y quiera construir una spec formal sin asumir nada técnico. Sigue el método de preguntas de a una con barra de progreso y validación de suposiciones.
---

# Spec Builder — Flujo de trabajo

Cuando un usuario entrega una **historia de desarrollador** (user story) en lenguaje natural y pide construir una especificación, sigue este proceso exacto:

---

## Fase 1: Lectura y listado de suposiciones

1. Lee la historia completa del usuario.
2. Identifica todo lo que **asumiste** para poder entender la historia — cosas que no están dichas explícitamente pero que necesitaste inferir.
3. Separa dos tipos de suposiciones:
   - **Suposiciones técnicas** (librerías, patrones, etc.) — NO las incluyas en la lista.
   - **Suposiciones no técnicas o funcionales** (comportamiento, UI, flujo, reglas de negocio) — SÍ inclúyelas.
4. Preséntalas como una lista numerada, cada una en una frase clara y simple, sin tecnicismos.
5. Dile al usuario: *"Aquí están todas las cosas que asumí para poder entender tu historia. Dime los números de las que no te gustan o no son correctas."*

## Fase 2: Recepción de correcciones

1. El usuario responde con los números de las suposiciones que no le gustan.
2. Para cada una de esas:
   - Anota mentalmente la corrección.
   - No preguntes nada todavía.

## Fase 3: Preguntas una por una

Para CADA suposición rechazada, haz una pregunta a la vez:

1. Siempre empieza con: **"Pregunta X/N"** donde X es el número actual y N es el total de preguntas.
2. Muestra una **barra de progreso** visual. Ejemplo:
   ```
   [████░░░░░░] 3/6
   ```
3. La pregunta debe ser sobre **la suposición rechazada** — no sobre otra cosa.
4. Ofrece **6 opciones** como posibles nuevas definiciones + una séptima opción llamada **"otra"**.
5. Si elige una opción (1-6), esa se convierte en la nueva definición.
6. Si elige "otra", el usuario te dará su propia respuesta — escúchala y úsala como definición.

## Fase 4: Confirmación

1. Una vez respondidas todas las preguntas, di únicamente: **"Listo"**.
2. No agregues adornos, explicaciones ni preguntas adicionales.
3. Espera a que el usuario te indique crear la especificación.

---

## Reglas estrictas

- **No uses lenguaje técnico ni siglas** (no: API, endpoint, hook, state, prop, component, etc.). Usa: formulario, pantalla, botón, lista, cuadro de texto.
- **Si no entiendes una palabra del usuario**, pregúntale qué significa antes de continuar.
- **No asumas nada.** Si necesitas algo que no está dicho explícitamente, conviértelo en una suposición y ponlo en la lista.
- **Las suposiciones incorrectas NO se descartan** — se refinan mediante preguntas.
- **No mezcles preguntas.** Una pregunta por mensaje. Siempre con barra de progreso.
- **Cuando las opciones incluyan "otra"**, ese texto debe ser exactamente `"otra"` (en minúsculas).
- **No muestres opciones para suposiciones que el usuario aceptó** — solo para las que rechazó.

---

## Formato de barra de progreso

Usa bloques █ para completado y ░ para pendiente. Calcula: `completados / total`.

Ejemplos:
- 0/6: `[░░░░░░░░░░] 0/6`
- 1/6: `[██░░░░░░░░] 1/6`
- 3/6: `[██████░░░░] 3/6`
- 6/6: `[██████████] 6/6`

---

## Formato de pregunta

```
**Pregunta X/N**
[██████░░░░] X/N

[texto de la pregunta]

1. [Opción 1]
2. [Opción 2]
3. [Opción 3]
4. [Opción 4]
5. [Opción 5]
6. [Opción 6]
7. otra
```

---

## Ejemplo resumido

Usuario da historia → Tú listas 15 suposiciones → Usuario dice "1, 3, 5" → Por cada una haces una pregunta con 6 opciones + otra → Usuario responde → Al final dices "Listo"
