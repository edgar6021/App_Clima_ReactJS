# App Clima

Aplicacion de clima en React + Vite lista para desplegar en Vercel.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploy en Vercel

Configuracion recomendada:

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

El archivo `vercel.json` ya define el build, el directorio de salida y el rewrite a `index.html` para que la app funcione como SPA.

No necesitas variables de entorno: la app usa Open-Meteo sin API key.
