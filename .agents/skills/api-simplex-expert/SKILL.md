---
name: api-simplex-expert
description: Reference for SimplexPro REST API. Use when integrating frontend with backend — knows all endpoints, payload shapes, response types, and quirks of the graphical/simplex solvers.
---

# SimplexPro API Expert

## Endpoints

### GET /problema/listar?page={page}
- **Response**: `List<ResumenProblema>`
  ```ts
  { id: string; titulo: string; descripcion: string | null; tipoOptimizacion: "MAX" | "MIN"; fechaCreacion: string }
  ```
- 10 items per page, paginated by `page` (1-indexed, default 1).

### POST /problema/registrar?metodo=grafico|simplex
- **Request body**: raw JSON dict (no Pydantic request model — validated manually by backend).
- **Response**: `{ "mensaje": "Problema guardado" }`
- `metodo` query param required.
- **Graphical** (`metodo=grafico`):
  ```ts
  {
    titulo: string;
    descripcion?: string;
    variables: { x: string; y: string };
    restricciones: { x: number; y: number; signo: "<=" | ">="; valor: number; glosa?: string }[];
    funcion_objetivo: { x: number; y: number; tipo: "max" | "min" };
  }
  ```
  - Signo: ONLY `<=` or `>=` (no `=`).
  - Variables MUST be exactly `x` and `y`.
- **Simplex** (`metodo=simplex`):
  ```ts
  {
    titulo: string;
    descripcion?: string;
    variables: Record<string, string>;     // { "x1": "name1", "x2": "name2", ... }
    restricciones: {
      [key: string]: number;               // coefficients per variable, e.g. x1: 2, x2: 3
      signo: "<=" | ">=" | "=";
      valor: number;
      glosa?: string;
    }[];
    funcion_objetivo: {
      [key: string]: number;               // coefficients per variable
      tipo: "max" | "min";
    };
  }
  ```
  - Variable keys MUST match regex `^x\d+$` (e.g., `x1`, `x2`, `x3`).
  - Every restriction MUST include ALL variable keys from `variables`.
  - Signo: `<=`, `>=`, or `=`.

### PUT /problema/actualizar?metodo=grafico|simplex
- Same payload as POST, but MUST include `problemaID` or `id` field in the body.

### GET /problema/solucion/grafica/{id}
- **Response**:
  ```ts
  {
    id: string;
    titulo: string;
    descripcion: string | null;
    tipoOptimizacion: "MAX" | "MIN";
    fechaCreacion: string;
    funcion_objetivo: string;        // e.g. "50x + 40y"
    mensaje: string;                 // natural language solution
    valoresFO: string[];             // vertex evaluations
    grafico: string;                 // raw base64 PNG (no `data:image/...` prefix)
    variables: { x: string; y: string };
    restricciones: { inecuacion: string; glosa: string | null }[];
  }
  ```

### GET /problema/solucion/simplex/{id}
- **Response**:
  ```ts
  {
    id: string;
    titulo: string;
    descripcion: string | null;
    tipoOptimizacion: "MAX" | "MIN";
    fechaCreacion: string;           // ALWAYS "" — backend bug, not fetched
    funcion_objetivo: string;
    mensaje: string;
    valor_fo: string;                // final objective value
    variables: Record<string, string>;
    restricciones: { inecuacion: string; glosa: string | null }[];
    iteraciones: {
      iteracion: number;
      entra: string;                 // entering variable
      sale: string;                  // leaving variable
      razonMinima: number;
      elementoPivote: number;
      tabla: Record<string, string[]>;  // see "Tableau Format" below
    }[];
  }
  ```

### DELETE /problema/eliminar/{id}
- **Response**: `{ "mensaje": "Problema eliminado" }`

### GET /problemas/{id}/exportar
- **Response**: `application/pdf` binary (Content-Disposition: attachment).

## Tableau Format (tabla)

Backend returns `tabla: Dict<string, string[]>` per iteration:

| Key     | Contents | Example |
|---------|----------|---------|
| `cb`    | Cost coeffs of basis vars. Last element `""` for Z row. | `["0", "3", "2", ""]` |
| `base`  | Basis var names. Last `"Z"`. | `["S1", "X1", "X2", "Z"]` |
| `x1`, `x2`, … | Column values per decision variable | `["2", "1", "0", "-3"]` |
| `S1`, `S2`, … | Column values per slack/surplus | `["1", "0", "0", "0"]` |
| `E1`, `E2`, … | Column values per excess | (only in >= constraints) |
| `A1`, `A2`, … | Column values per artificial | (only in >= or = constraints) |
| `R`     | RHS column (last is Z value) | `["35", "6", "21", "57"]` |

Convert to SimplexTableData for the React component:
- `tabla.cb[i]` → `rows[i].cb`
- `tabla.base[i]` → `rows[i].base`
- Each variable column + slack/artificial columns → `rows[i].coefficients`
- `tabla.R[i]` → `rows[i].rhs`
- Variable columns keys define column headers
- Last row (where `base` = `"Z"`) → `zRow` (skip the last empty `cb`)

## Error Responses

| Code | Format | Common cases |
|------|--------|-------------|
| 400 | `{ "detail": "..." }` | Missing fields, invalid signs, wrong variable names |
| 404 | `{ "detail": "Problema no encontrado" }` | Bad ID |
| 500 | `{ "detail": "..." }` | Solver errors (infeasible region), PDF generation failures |

## Known quirks
- `fechaCreacion` in simplex response is always `""` (backend omits it from SELECT)
- `grafico` may be `""` if solver found no feasible region
- Backend validates client errors as 400, solver/runtime errors as 500
- No Vite proxy configured — add proxy for `/problema` and `/problemas` to `http://localhost:8000` in dev
