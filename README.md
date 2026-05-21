# SimplexPro Frontend

Aplicacion web SPA para modelar y resolver problemas de Programacion Lineal mediante los metodos Simplex y Grafico. Consume la API REST de SimplexPro para el procesamiento de calculos.

## Stack

| Tecnologia | Version |
|---|---|
| Node.js | 22 |
| pnpm | 10+ |
| React | 19.2.6 |
| TypeScript | 6.0.2 |
| Vite | 8.0.12 |
| react-router-dom | 7.15.0 |

## Estructura del proyecto

```
src/
├── main.tsx                     Punto de entrada (BrowserRouter)
├── App.tsx                      Definicion de rutas
├── types/index.ts               Interfaces, tipos y helpers compartidos
├── api/client.ts                Cliente HTTP (fetch) con manejo de errores
├── pages/
│   ├── Dashboard.tsx            Listado de problemas con paginacion y eliminacion
│   ├── RegistroSimplex.tsx      Formulario de creacion/edicion (metodo simplex)
│   ├── RegistroGrafico.tsx      Formulario de creacion/edicion (metodo grafico)
│   ├── ResultadoSimplex.tsx     Visualizacion de iteraciones y tablas simplex
│   └── ResultadoGrafico.tsx     Visualizacion de grafico y evaluacion en vertices
├── components/
│   ├── FormInput.tsx            Input reutilizable con label, validacion y accesibilidad
│   ├── FormSelect.tsx           Select reutilizable con label y validacion
│   ├── SimplexTableau.tsx       Tabla de iteracion simplex con resaltado de fila Z
│   ├── SummaryModal.tsx         Modal de confirmacion previo al envio
│   ├── ConfirmModal.tsx         Modal de confirmacion para eliminacion
│   └── Toast.tsx                Notificacion temporal con auto-dismiss
├── assets/                      Imagenes PNG (iconos, logo)
└── index.css                    Estilos globales con variables CSS
```

## Arquitectura

- **Ruteo**: React Router v7 con 7 rutas definidas en App.tsx.
- **Estado**: Cada pagina gestiona su estado con hooks (useState, useEffect). No hay estado global ni libreria externa.
- **API**: Capa de fetch plana con clase ApiRequestError para errores tipados. Sin React Query ni axios.
- **Proxy**: Vite redirige /problemas hacia http://localhost:8000.
- **Estilos**: CSS plano con variables CSS. Sin Tailwind, CSS Modules ni styled-components.
- **Flujo de datos**: Formulario -> estado local -> validacion -> modal de resumen -> API -> redireccion a resultados.

## Rutas

| Ruta | Componente | Proposito |
|---|---|---|
| `/` | Dashboard | Listado de problemas |
| `/registrar/problema/simplex` | RegistroSimplex | Crear problema simplex |
| `/registrar/problema/grafico` | RegistroGrafico | Crear problema grafico |
| `/editar/problema/:id/simplex` | RegistroSimplex | Editar problema simplex |
| `/editar/problema/:id/grafico` | RegistroGrafico | Editar problema grafico |
| `/problema/:id/simplex` | ResultadoSimplex | Ver solucion simplex |
| `/problema/:id/grafico` | ResultadoGrafico | Ver solucion grafica |

## Tipos de problema

### Metodo Grafico
- Dos variables (x, y) con nombres personalizables.
- Signos permitidos: <=, >=.
- La respuesta incluye un campo `grafico` con base64 sin prefijo data:image.

### Metodo Simplex
- N variables (x1, x2, ..., xn) con nombres personalizables, de 2 a 20.
- Signos permitidos: <=, >=, =.
- La respuesta incluye iteraciones con tablas (columnas: cb, base, variables, R).
- Las tablas se renderizan con el componente SimplexTableau.

## Comandos

```bash
pnpm install      Instalar dependencias
pnpm dev          Servidor de desarrollo (Vite)
pnpm build        Typecheck + build produccion
pnpm preview      Vista previa de build produccion
pnpm lint         ESLint con configuracion plana
```

## Backend

Repositorio: https://github.com/AlssyLop/simplexPro
Servidor de desarrollo: http://localhost:8000

### Endpoints utilizados

| Metodo | Ruta | Proposito |
|---|---|---|
| GET | /problemas?page=N | Listar problemas paginados |
| POST | /problemas/registrar?metodo=simplex|grafico | Crear y resolver problema |
| GET | /problemas/{id} | Obtener solucion |
| GET | /problemas/{id}/formulario | Obtener datos para edicion |
| PUT | /problemas/actualizar?metodo=simplex|grafico&id={id} | Actualizar problema existente |
| DELETE | /problemas/eliminar/{id} | Eliminar problema |

### Formato de payloads

**Simplex:**
```json
{
  "titulo": "Problema de produccion",
  "variables": { "x1": "Producto A", "x2": "Producto B" },
  "funcion_objetivo": {
    "tipo": "max",
    "terminos": { "Producto A": 10, "Producto B": 20 }
  },
  "restricciones": [
    {
      "terminos": { "Producto A": 2, "Producto B": 1 },
      "signo": "<=",
      "constante": 100,
      "glosa": "Horas disponibles"
    }
  ]
}
```

**Grafico:**
```json
{
  "titulo": "Produccion de muebles",
  "variables": { "x": "Mesa", "y": "Silla" },
  "funcion_objetivo": { "x": 5, "y": 8, "tipo": "max" },
  "restricciones": [
    { "x": 2, "y": 1, "signo": "<=", "constante": 100 }
  ]
}
```

## Convenciones de codigo

- `verbatimModuleSyntax: true` -> usar `import type` para imports solo de tipos.
- `erasableSyntaxOnly: true` -> prohibido enum, namespace, parameter properties.
- `noUnusedLocals` y `noUnusedParameters` -> prefijar con `_` parametros intencionalmente no usados.
- CSS plano con variables en `:root`. Sin frameworks de CSS.
- Componentes funcionales sin librerias de estado externas.
