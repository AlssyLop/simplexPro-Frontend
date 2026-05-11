# SimplexPro Frontend

SimplexPro Frontend es una aplicación web desarrollada con React y TypeScript, diseñada para la visualización y gestión de problemas de Programación Lineal con modelos de optimización mediante los métodos Simplex y Gráfico.

## Características principales

- Diseño centrado en la experiencia de usuario para el modelado de problemas de PL.
- Visualización paso a paso de la resolución mediante el Método Simplex.
- Representación gráfica de problemas de optimización de dos variables.
- Integración con el servicio backend para el procesamiento de cálculos complejos.

## Integración con el Backend

Se consume los servicios de la API REST de SimplexPro, encargada de calcular los modelos de programación lineal.

Repositorio del backend: https://github.com/AlssyLop/simplexPro

## Requisitos y Versiones

- Node.js: Versión 22
- Gestor de paquetes: pnpm
- React: 19.2.6
- TypeScript: 6.0.2
- Vite: 8.0.12

## Ejecución del Proyecto

### Instalación de dependencias

```bash
pnpm install
```

### Desarrollo

Inicia el servidor de desarrollo local:

```bash
pnpm dev
```

### Construcción para producción

Genera los archivos para despliegue:

```bash
pnpm build
```

### Vista previa de producción

Previsualiza la versión de producción localmente:

```bash
pnpm preview
```
