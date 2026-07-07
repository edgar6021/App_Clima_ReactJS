const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
];

const HOURLY_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation_probability',
  'weather_code',
  'wind_speed_10m',
  'uv_index',
];

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
];

export const WEATHER_CODES = {
  0: { label: 'Despejado', icon: '☀️', tone: 'sunny' },
  1: { label: 'Mayormente despejado', icon: '🌤️', tone: 'sunny' },
  2: { label: 'Parcialmente nublado', icon: '⛅', tone: 'cloudy' },
  3: { label: 'Nublado', icon: '☁️', tone: 'cloudy' },
  45: { label: 'Niebla', icon: '🌫️', tone: 'fog' },
  48: { label: 'Niebla helada', icon: '🌫️', tone: 'fog' },
  51: { label: 'Llovizna ligera', icon: '🌦️', tone: 'rain' },
  53: { label: 'Llovizna', icon: '🌦️', tone: 'rain' },
  55: { label: 'Llovizna intensa', icon: '🌧️', tone: 'rain' },
  56: { label: 'Llovizna helada', icon: '🌧️', tone: 'rain' },
  57: { label: 'Llovizna helada intensa', icon: '🌧️', tone: 'rain' },
  61: { label: 'Lluvia ligera', icon: '🌧️', tone: 'rain' },
  63: { label: 'Lluvia', icon: '🌧️', tone: 'rain' },
  65: { label: 'Lluvia intensa', icon: '🌧️', tone: 'rain' },
  66: { label: 'Lluvia helada', icon: '🌧️', tone: 'rain' },
  67: { label: 'Lluvia helada intensa', icon: '🌧️', tone: 'rain' },
  71: { label: 'Nieve ligera', icon: '🌨️', tone: 'snow' },
  73: { label: 'Nieve', icon: '🌨️', tone: 'snow' },
  75: { label: 'Nieve intensa', icon: '❄️', tone: 'snow' },
  77: { label: 'Granulos de nieve', icon: '❄️', tone: 'snow' },
  80: { label: 'Chubascos ligeros', icon: '🌦️', tone: 'rain' },
  81: { label: 'Chubascos', icon: '🌧️', tone: 'rain' },
  82: { label: 'Chubascos intensos', icon: '⛈️', tone: 'storm' },
  85: { label: 'Chubascos de nieve', icon: '🌨️', tone: 'snow' },
  86: { label: 'Chubascos de nieve intensos', icon: '❄️', tone: 'snow' },
  95: { label: 'Tormenta', icon: '⛈️', tone: 'storm' },
  96: { label: 'Tormenta con granizo', icon: '⛈️', tone: 'storm' },
  99: { label: 'Tormenta severa con granizo', icon: '⛈️', tone: 'storm' },
};

export const getWeatherInfo = (code) =>
  WEATHER_CODES[code] ?? { label: 'Clima variable', icon: '🌡️', tone: 'default' };

export const getAqiInfo = (aqi) => {
  if (aqi == null) return { label: 'Sin datos', tone: 'muted' };
  if (aqi <= 50) return { label: 'Bueno', tone: 'good' };
  if (aqi <= 100) return { label: 'Moderado', tone: 'ok' };
  if (aqi <= 150) return { label: 'Sensible', tone: 'warn' };
  if (aqi <= 200) return { label: 'No saludable', tone: 'bad' };
  if (aqi <= 300) return { label: 'Muy malo', tone: 'bad' };
  return { label: 'Peligroso', tone: 'bad' };
};

const buildUrl = (baseUrl, params) => {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value);
  });

  return url.toString();
};

const fetchJson = async (url, signal) => {
  const response = await fetch(url, { signal });
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.reason || 'No se pudo obtener informacion del clima.');
  }

  return data;
};

export const formatPlaceName = (place) => {
  const parts = [place.name];

  if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
  if (place.country) parts.push(place.country);

  return parts.filter(Boolean).join(', ');
};

const normalizePlace = (place) => {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);

  return {
    id: place.id ?? `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    name: place.name,
    admin1: place.admin1,
    country: place.country,
    countryCode: place.country_code ?? place.countryCode,
    latitude,
    longitude,
    timezone: place.timezone,
    population: place.population,
    label: place.label ?? formatPlaceName(place),
  };
};

const listFromColumns = (source = {}, keys) =>
  (source.time ?? []).map((time, index) =>
    keys.reduce(
      (item, key) => ({
        ...item,
        [key]: source[key]?.[index] ?? null,
      }),
      { time },
    ),
  );

const normalizeAirQuality = (data, currentTime) => {
  if (!data?.hourly?.time?.length) return null;

  const currentHour = currentTime?.slice(0, 13);
  let index = data.hourly.time.findIndex((time) => time.slice(0, 13) >= currentHour);

  if (index < 0) index = 0;

  const usAqi = data.hourly.us_aqi?.[index] ?? null;

  return {
    time: data.hourly.time[index],
    usAqi,
    pm10: data.hourly.pm10?.[index] ?? null,
    pm25: data.hourly.pm2_5?.[index] ?? null,
    uvIndex: data.hourly.uv_index?.[index] ?? null,
    ...getAqiInfo(usAqi),
  };
};

const getForecast = async (latitude, longitude, signal) => {
  const forecastUrl = buildUrl(FORECAST_URL, {
    latitude,
    longitude,
    current: CURRENT_FIELDS,
    hourly: HOURLY_FIELDS,
    daily: DAILY_FIELDS,
    timezone: 'auto',
    forecast_days: 7,
  });

  const airQualityUrl = buildUrl(AIR_QUALITY_URL, {
    latitude,
    longitude,
    hourly: ['us_aqi', 'pm10', 'pm2_5', 'uv_index'],
    timezone: 'auto',
    forecast_days: 1,
  });

  const [forecast, airQuality] = await Promise.all([
    fetchJson(forecastUrl, signal),
    fetchJson(airQualityUrl, signal).catch(() => null),
  ]);

  const currentHour = forecast.current?.time?.slice(0, 13);
  const hourly = listFromColumns(forecast.hourly, HOURLY_FIELDS).filter(
    (hour) => !currentHour || hour.time.slice(0, 13) >= currentHour,
  );

  return {
    current: forecast.current,
    currentUnits: forecast.current_units,
    daily: listFromColumns(forecast.daily, DAILY_FIELDS),
    hourly,
    airQuality: normalizeAirQuality(airQuality, forecast.current?.time),
    timezone: forecast.timezone,
    timezoneAbbreviation: forecast.timezone_abbreviation,
    elevation: forecast.elevation,
  };
};

export const getCitySuggestions = async (query, signal) => {
  const url = buildUrl(GEOCODING_URL, {
    name: query,
    count: 6,
    language: 'es',
    format: 'json',
  });

  const data = await fetchJson(url, signal);

  return (data.results ?? []).map(normalizePlace);
};

export const getForecastForPlace = async (place, signal) => {
  const normalizedPlace = normalizePlace(place);
  const forecast = await getForecast(
    normalizedPlace.latitude,
    normalizedPlace.longitude,
    signal,
  );

  return {
    place: normalizedPlace,
    ...forecast,
  };
};

export const getForecastForCity = async (city, signal) => {
  const [place] = await getCitySuggestions(city, signal);

  if (!place) {
    throw new Error(`No encontre resultados para "${city}". Prueba con otra ciudad.`);
  }

  return getForecastForPlace(place, signal);
};

export const getForecastForCoordinates = async (latitude, longitude, signal) => {
  const place = {
    id: `geo-${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`,
    name: 'Mi ubicacion',
    latitude,
    longitude,
    label: 'Mi ubicacion actual',
  };

  return getForecastForPlace(place, signal);
};
