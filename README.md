# MeteoPanel

Aplicación meteorológica en React + Vite con pronóstico en tiempo real, calidad del aire, recomendaciones operativas, búsqueda de ciudades, geolocalización y ubicaciones guardadas.

## Stack

- React 18
- Vite
- Open-Meteo Forecast API
- Open-Meteo Geocoding API
- Open-Meteo Air Quality API

## Desarrollo local

```bash
npm install
npm run dev
```

## Validación

```bash
npm run lint
npm run build
```

## Despliegue en Vercel

El proyecto incluye `vercel.json` con configuración explícita para Vite:

- Framework: `vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

No se requieren variables de entorno. La aplicación consume Open-Meteo sin API key.
