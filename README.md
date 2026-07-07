# MeteoPanel

MeteoPanel es una aplicacion web de monitoreo meteorologico desarrollada con React y Vite. Permite consultar condiciones actuales, pronostico por hora, pronostico extendido, calidad del aire y recomendaciones operativas para cualquier ciudad.

La aplicacion esta orientada a una experiencia clara, moderna y funcional: busqueda rapida, informacion priorizada, metricas relevantes y despliegue listo para produccion en Vercel.

## Funcionalidades

- Consulta meteorologica en tiempo real por ciudad.
- Busqueda de ubicaciones con sugerencias.
- Deteccion de ubicacion actual mediante geolocalizacion del navegador.
- Pronostico por hora para las proximas 24 horas.
- Pronostico extendido de 7 dias.
- Indicadores de temperatura, sensacion termica, humedad, viento, presion, nubosidad, precipitacion e indice UV.
- Calidad del aire con AQI.
- Recomendaciones operativas segun lluvia, viento, radiacion UV y luz natural.
- Ubicaciones guardadas en `localStorage`.
- Cambio entre Celsius y Fahrenheit.
- Diseno responsive para escritorio, tablet y movil.

## Tecnologias

- React 18
- Vite 5
- JavaScript ES Modules
- CSS moderno sin dependencias externas
- Open-Meteo Forecast API
- Open-Meteo Geocoding API
- Open-Meteo Air Quality API
- Vercel para despliegue

## Requisitos

- Node.js 18 o superior
- npm

## Instalacion

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

Por defecto, Vite expone la aplicacion en:

```bash
http://localhost:5173
```

## Scripts disponibles

```bash
npm run dev
```

Inicia el servidor de desarrollo.

```bash
npm run build
```

Genera la version de produccion en la carpeta `dist`.

```bash
npm run preview
```

Sirve localmente el build de produccion.

```bash
npm run lint
```

Ejecuta ESLint sobre los archivos JavaScript y JSX.

## Estructura del proyecto

```text
AppClima/
|-- public/
|-- src/
|   |-- App.jsx
|   |-- App.css
|   |-- api.js
|   |-- index.css
|   `-- main.jsx
|-- index.html
|-- package.json
|-- vercel.json
`-- README.md
```

## Integracion de datos

La aplicacion consume servicios publicos de Open-Meteo:

- Geocoding API: busqueda y normalizacion de ciudades.
- Forecast API: clima actual, pronostico horario y pronostico diario.
- Air Quality API: calidad del aire, particulas e indice UV.

No se requiere API key ni variables de entorno para ejecutar el proyecto.

## Despliegue en Vercel

El repositorio incluye `vercel.json` con configuracion explicita para Vite:

```json
{
  "framework": "vite",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Configuracion recomendada en Vercel:

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

## Validacion antes de publicar

Antes de subir cambios a produccion, ejecuta:

```bash
npm run lint
npm run build
```

## Notas de producto

MeteoPanel prioriza la lectura rapida de informacion accionable. La interfaz esta organizada en bloques de decision: condiciones actuales, recomendacion principal, indicadores meteorologicos, evolucion horaria y pronostico semanal.

## Licencia

Este proyecto esta disponible bajo la licencia incluida en el repositorio.
