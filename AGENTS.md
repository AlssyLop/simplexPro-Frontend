# SimplexPro Frontend — Agent Guide

## Stack
- React 19 + TypeScript 6 + Vite 8 + pnpm (v9+)

## Commands
- `pnpm dev` — dev server (Vite)
- `pnpm build` — typecheck (`tsc -b`) then build (`vite build`)
- `pnpm lint` — ESLint flat config (`eslint .`)
- `pnpm preview` — preview production build

Always run `pnpm lint` after editing. Run `pnpm build` before finalizing.

## TypeScript quirks
- `verbatimModuleSyntax: true` → must use `import type` for type-only imports
- `erasableSyntaxOnly: true` → no `enum`, no `namespace`, no `constructor parameter properties`
- `noUnusedLocals` + `noUnusedParameters` → strict (add `_` prefix to intentionally unused params)

## Project state (May 2026)
Scaffolded from `create-vite` — not yet customized. No router, no state library installed. `src/App.tsx` is the default Vite starter. The `api-simplex-expert` skill under `.agents/skills/` documents all backend endpoints.

## Backend API
- Repo: `github.com/AlssyLop/simplexPro`
- Dev server: `http://localhost:8000`
- Add a Vite proxy for `http://localhost:8000`.
- Key endpoints:
  - `GET /problema/listar?page=1` — list problems
  - `POST /problema/registrar?metodo=grafico|simplex` — create + solve
  - `GET /problema/solucion/grafica/{id}` — graphical solution (incl. base64 PNG)
  - `GET /problema/solucion/simplex/{id}` — simplex solution (iterations with tableaus)
  - `GET /problemas/{id}/exportar` — PDF download

## Request/Response shapes
See `.agents/skills/api-simplex-expert/SKILL.md` for full payload schemas.

Quick reference for the two problem types:
- **Gráfico**: variables must be exactly `x` and `y`, signs `<=`/`>=` only.
- **Simplex**: variable keys must match `x1`, `x2`, ..., `xn`, signs `<=`/`>=`/`=`.

## Simplex tableaus
Backend returns `tabla: Dict<string, string[]>` per iteration. Convert with:
- `tabla.cb` → row cost coefficients (last element `""` is Z row)
- `tabla.base` → basis variable names (last `"Z"`)
- variable columns (`x1`, `x2`, etc.) + slack columns (`S1`, `E1`, `A1`) → coefficients matrix
- `tabla.R` → RHS column
See `.agents/skills/simplex-table-design/` for the React component reference.

## Graphical results
`grafico` field is a raw base64 string (no `data:image/png;base64,` prefix). Render as:
```tsx
<img src={`data:image/png;base64,${result.grafico}`} alt="..." />
```

## Testing
No test framework configured yet. If adding one, prefer Vitest (Vite-native).

## Known quirks
- `fechaCreacion` in simplex GET response is always `""` (backend bug — not fetched from DB)
- The `grafico` field may be `""` if the solver found no feasible region
- Backend validates client-side errors as `400`, resolver errors as `500`
