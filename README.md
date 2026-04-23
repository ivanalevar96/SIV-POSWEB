# SVI POS — Vite + React + Tailwind

Implementación del diseño "SVI — POS Completos" (handoff de Claude Design) en un proyecto Vite + React + Tailwind.

## Comandos

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción
npm run preview   # preview del build
```

## Estructura

```
src/
  main.jsx              # entry point
  App.jsx               # shell del prototipo (device frame + viewport switcher)
  Shell.jsx             # sidebar / bottom nav
  data.js               # productos, ventas, helpers
  icons.jsx             # set de íconos
  ui.jsx                # primitivas: Button, Card, Charts, Modal, etc.
  views/
    Login.jsx
    Dashboard.jsx
    POS.jsx
    Productos.jsx
    Historial.jsx
    Estadisticas.jsx
  index.css             # variables CSS, animaciones, utilidades globales
```

## Notas sobre la migración

El prototipo original usaba Babel in-browser con globales en `window`. Se convirtió a módulos ES con `import`/`export` y se mantuvo pixel-perfect el estilo visual (variables CSS, animaciones, clases utilitarias).

- Las clases Tailwind funcionan nativas (ya no vía CDN).
- Los charts (BarChart / Donut / LineChart) son SVG puros, sin dependencias.
- El panel Tweaks del original se omitió (solo vivía dentro del editor de Claude Design).
