import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAqiInfo,
  getCitySuggestions,
  getForecastForCity,
  getForecastForCoordinates,
  getForecastForPlace,
  getWeatherInfo,
} from './api';
import './App.css';

const DEFAULT_CITY = 'Santo Domingo';
const QUICK_CITIES = ['Santo Domingo', 'Nueva York', 'Madrid', 'Tokio', 'Buenos Aires'];

const STORAGE_KEYS = {
  favorites: 'clima:favorites',
  lastPlace: 'clima:last-place',
  unit: 'clima:unit',
};

const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be disabled in private browsing.
  }
};

const readJsonStorage = (key, fallback) => {
  const value = readStorage(key);

  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getPlaceKey = (place) =>
  `${Number(place.latitude).toFixed(3)},${Number(place.longitude).toFixed(3)}`;

const formatHour = (value) => value?.slice(11, 16) ?? '--:--';

const formatDateTime = (value) => {
  if (!value) return 'Sin hora disponible';

  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatDay = (value) => {
  if (!value) return '--';

  return new Intl.DateTimeFormat('es', {
    weekday: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
};

const getWindDirection = (degrees) => {
  if (degrees == null) return '--';

  return WIND_DIRECTIONS[Math.round(degrees / 45) % WIND_DIRECTIONS.length];
};

const getUvInfo = (uvIndex) => {
  if (uvIndex == null) return 'Sin datos';
  if (uvIndex <= 2) return 'Bajo';
  if (uvIndex <= 5) return 'Moderado';
  if (uvIndex <= 7) return 'Alto';
  if (uvIndex <= 10) return 'Muy alto';
  return 'Extremo';
};

const renderConditionMark = (weatherInfo, size = 'hero') => (
  <span
    className={`condition-mark condition-mark-${size} condition-${weatherInfo.tone}`}
    aria-label={weatherInfo.label}
    role="img"
    title={weatherInfo.label}
  />
);

const LoadingView = () => (
  <section className="loading-grid" aria-live="polite" aria-label="Cargando clima">
    <div className="skeleton skeleton-hero" />
    <div className="skeleton-stack">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  </section>
);

const EmptyView = () => (
  <section className="empty-state">
    <p className="eyebrow">Listo para buscar</p>
    <h2>Elige una ciudad para ver el clima real.</h2>
    <p>La app usa datos en vivo de Open-Meteo, sin cuentas ni llaves privadas.</p>
  </section>
);

function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [unit, setUnit] = useState(() => readStorage(STORAGE_KEYS.unit) || 'celsius');
  const [favorites, setFavorites] = useState(() =>
    readJsonStorage(STORAGE_KEYS.favorites, []),
  );
  const requestIdRef = useRef(0);

  const applyWeather = useCallback((data) => {
    setWeather(data);
    setQuery(data.place.label);
    setSuggestions([]);
    setStatus('ready');
    setError('');
    writeStorage(STORAGE_KEYS.lastPlace, JSON.stringify(data.place));
  }, []);

  const runWeatherRequest = useCallback(
    async (loader) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setStatus('loading');
      setError('');

      try {
        const data = await loader();
        if (requestId !== requestIdRef.current) return;
        applyWeather(data);
      } catch (requestError) {
        if (requestId !== requestIdRef.current) return;
        setStatus('error');
        setError(
          requestError?.message ||
            'No pude cargar el clima ahora. Revisa la conexion e intenta de nuevo.',
        );
      }
    },
    [applyWeather],
  );

  const loadCity = useCallback(
    (city) => runWeatherRequest(() => getForecastForCity(city)),
    [runWeatherRequest],
  );

  const loadPlace = useCallback(
    (place) => runWeatherRequest(() => getForecastForPlace(place)),
    [runWeatherRequest],
  );

  useEffect(() => {
    const savedPlace = readJsonStorage(STORAGE_KEYS.lastPlace, null);

    if (savedPlace?.latitude && savedPlace?.longitude) {
      loadPlace(savedPlace);
      return;
    }

    loadCity(DEFAULT_CITY);
  }, [loadCity, loadPlace]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.unit, unit);
  }, [unit]);

  useEffect(() => {
    const text = query.trim();

    if (text.length < 2 || text === weather?.place.label) {
      setSuggestions([]);
      setIsSuggesting(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSuggesting(true);

      try {
        const results = await getCitySuggestions(text, controller.signal);
        setSuggestions(results);
      } catch (suggestionError) {
        if (suggestionError.name !== 'AbortError') setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, weather?.place.label]);

  const formatTemp = useCallback(
    (value) => {
      if (value == null) return '--';
      const nextValue = unit === 'fahrenheit' ? value * (9 / 5) + 32 : value;
      const suffix = unit === 'fahrenheit' ? 'F' : 'C';

      return `${Math.round(nextValue)}\u00b0${suffix}`;
    },
    [unit],
  );

  const formatWind = useCallback(
    (value) => {
      if (value == null) return '--';
      const nextValue = unit === 'fahrenheit' ? value * 0.621371 : value;
      const suffix = unit === 'fahrenheit' ? 'mph' : 'km/h';

      return `${Math.round(nextValue)} ${suffix}`;
    },
    [unit],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = query.trim();

    if (!text) return;

    const exactMatch = suggestions.find((place) => {
      const normalizedText = text.toLowerCase();
      return (
        place.label.toLowerCase() === normalizedText ||
        place.name.toLowerCase() === normalizedText
      );
    });

    if (exactMatch) {
      loadPlace(exactMatch);
      return;
    }

    loadCity(text);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no permite geolocalizacion.');
      return;
    }

    setGeoLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        runWeatherRequest(() =>
          getForecastForCoordinates(
            position.coords.latitude,
            position.coords.longitude,
          ),
        ).finally(() => setGeoLoading(false));
      },
      () => {
        setGeoLoading(false);
        setError('No pude acceder a tu ubicacion. Puedes buscar la ciudad manualmente.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5 * 60 * 1000,
        timeout: 10000,
      },
    );
  };

  const current = weather?.current;
  const today = weather?.daily?.[0];
  const weatherInfo = getWeatherInfo(current?.weather_code);
  const aqiInfo = getAqiInfo(weather?.airQuality?.usAqi);
  const currentPlaceKey = weather ? getPlaceKey(weather.place) : '';
  const isFavorite = favorites.some((place) => getPlaceKey(place) === currentPlaceKey);
  const theme = current?.is_day === 0 ? 'theme-night' : `theme-${weatherInfo.tone}`;

  const metrics = useMemo(() => {
    if (!current) return [];

    return [
      {
        label: 'Sensacion',
        value: formatTemp(current.apparent_temperature),
        detail:
          Math.abs(current.apparent_temperature - current.temperature_2m) < 2
            ? 'Muy cerca de la temperatura real'
            : 'El cuerpo lo percibe diferente',
      },
      {
        label: 'Humedad',
        value: `${current.relative_humidity_2m ?? '--'}%`,
        detail:
          current.relative_humidity_2m >= 70
            ? 'Ambiente cargado'
            : 'Ambiente manejable',
      },
      {
        label: 'Viento',
        value: formatWind(current.wind_speed_10m),
        detail: `${getWindDirection(current.wind_direction_10m)} con rafagas de ${formatWind(
          current.wind_gusts_10m,
        )}`,
      },
      {
        label: 'Presion',
        value: `${Math.round(current.pressure_msl ?? 0)} hPa`,
        detail: 'Nivel medio del mar',
      },
      {
        label: 'Nubes',
        value: `${current.cloud_cover ?? '--'}%`,
        detail: current.cloud_cover > 65 ? 'Cielo bastante cubierto' : 'Cielo abierto',
      },
      {
        label: 'Lluvia ahora',
        value: `${current.precipitation ?? 0} mm`,
        detail:
          current.precipitation > 0 ? 'Hay precipitacion activa' : 'Sin lluvia registrada',
      },
      {
        label: 'Indice UV',
        value: Math.round(today?.uv_index_max ?? weather?.airQuality?.uvIndex ?? 0),
        detail: getUvInfo(today?.uv_index_max ?? weather?.airQuality?.uvIndex),
      },
      {
        label: 'Aire',
        value: weather?.airQuality?.usAqi ?? '--',
        detail: aqiInfo.label,
      },
    ];
  }, [aqiInfo.label, current, formatTemp, formatWind, today, weather?.airQuality]);

  const insights = useMemo(() => {
    if (!weather || !current || !today) return [];

    const nextRainHour = weather.hourly.find(
      (hour) => Number(hour.precipitation_probability) >= 50,
    );
    const rainProbability = today.precipitation_probability_max ?? 0;
    const strongWind = current.wind_gusts_10m >= 45 || today.wind_speed_10m_max >= 35;
    const highUv = today.uv_index_max >= 7;

    return [
      {
        title: rainProbability >= 50 ? 'Lleva paraguas' : 'Paraguas opcional',
        value: `${rainProbability}%`,
        detail: nextRainHour
          ? `Mayor riesgo desde las ${formatHour(nextRainHour.time)}`
          : 'Sin bloque de lluvia fuerte en las proximas horas',
      },
      {
        title: highUv ? 'Proteccion solar' : 'UV controlado',
        value: getUvInfo(today.uv_index_max),
        detail: `Maximo UV estimado: ${Math.round(today.uv_index_max ?? 0)}`,
      },
      {
        title: strongWind ? 'Cuidado con el viento' : 'Viento estable',
        value: formatWind(current.wind_gusts_10m),
        detail: `Direccion dominante ${getWindDirection(current.wind_direction_10m)}`,
      },
      {
        title: 'Amanecer y atardecer',
        value: `${formatHour(today.sunrise)} / ${formatHour(today.sunset)}`,
        detail: `Zona horaria: ${weather.timezoneAbbreviation || weather.timezone}`,
      },
    ];
  }, [current, formatWind, today, weather]);

  const toggleFavorite = () => {
    if (!weather) return;

    setFavorites((currentFavorites) => {
      const exists = currentFavorites.some(
        (place) => getPlaceKey(place) === getPlaceKey(weather.place),
      );
      const nextFavorites = exists
        ? currentFavorites.filter((place) => getPlaceKey(place) !== getPlaceKey(weather.place))
        : [
            weather.place,
            ...currentFavorites.filter(
              (place) => getPlaceKey(place) !== getPlaceKey(weather.place),
            ),
          ].slice(0, 8);

      writeStorage(STORAGE_KEYS.favorites, JSON.stringify(nextFavorites));
      return nextFavorites;
    });
  };

  const toggleUnit = () => {
    setUnit((currentUnit) => (currentUnit === 'celsius' ? 'fahrenheit' : 'celsius'));
  };

  return (
    <main className={`app-shell ${theme}`}>
      <div className="app-container">
        <header className="app-header">
          <div className="brand-block">
            <div className="brand-row">
              <span className="brand-mark" aria-hidden="true">
                CM
              </span>
              <div>
                <p className="eyebrow">Clima en vivo</p>
                <h1>Clima Maestro</h1>
              </div>
            </div>
            <p className="header-copy">
              Pronostico por hora, 7 dias, calidad del aire y recomendaciones utiles
              para decidir rapido.
            </p>
            <div className="status-row" aria-label="Estado de datos">
              <span>Datos Open-Meteo</span>
              <span>Sin API key</span>
              <span>{status === 'loading' ? 'Actualizando' : 'Operativo'}</span>
            </div>
          </div>

          <div className="header-actions">
            <button className="ghost-button" type="button" onClick={toggleUnit}>
              {unit === 'celsius' ? '\u00b0C' : '\u00b0F'}
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={handleUseMyLocation}
              disabled={geoLoading}
            >
              {geoLoading ? 'Ubicando...' : 'Usar mi ubicacion'}
            </button>
          </div>
        </header>

        <section className="control-panel" aria-label="Buscar clima por ciudad">
          <form className="search-form" onSubmit={handleSubmit}>
            <label htmlFor="city-search">Ciudad</label>
            <div className="search-row">
              <input
                id="city-search"
                type="search"
                value={query}
                placeholder="Busca cualquier ciudad del mundo"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="primary-button" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {(suggestions.length > 0 || isSuggesting) && (
              <div className="suggestions" role="listbox">
                {isSuggesting && <span className="suggestion-muted">Buscando ciudades...</span>}
                {suggestions.map((place) => (
                  <button
                    key={`${place.id}-${place.latitude}-${place.longitude}`}
                    type="button"
                    onClick={() => loadPlace(place)}
                  >
                    <span>{place.label}</span>
                    <small>{place.timezone}</small>
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="quick-row" aria-label="Ciudades sugeridas">
            {QUICK_CITIES.map((city) => (
              <button key={city} type="button" onClick={() => loadCity(city)}>
                {city}
              </button>
            ))}
          </div>
        </section>

        {error && <div className="notice">{error}</div>}

        {status === 'loading' && !weather && <LoadingView />}
        {status !== 'loading' && !weather && <EmptyView />}

        {weather && current && (
          <>
            <section className="current-grid">
              <article className="current-card">
                <div className="current-top">
                  <div>
                    <p className="eyebrow">Ahora en</p>
                    <h2>{weather.place.label}</h2>
                    <p>
                      Actualizado {formatDateTime(current.time)} -{' '}
                      {weather.timezoneAbbreviation || weather.timezone}
                    </p>
                  </div>
                  <div className="weather-symbol">{renderConditionMark(weatherInfo)}</div>
                </div>

                <div className="temperature-block">
                  <span>{formatTemp(current.temperature_2m)}</span>
                  <div>
                    <strong>{weatherInfo.label}</strong>
                    <p>Se siente como {formatTemp(current.apparent_temperature)}</p>
                  </div>
                </div>

                <div className="sun-row">
                  <span>Amanecer {formatHour(today?.sunrise)}</span>
                  <span>Atardecer {formatHour(today?.sunset)}</span>
                </div>
              </article>

              <aside className="decision-card">
                <div>
                  <p className="eyebrow">Decision rapida</p>
                  <h3>{insights[0]?.title}</h3>
                  <p>{insights[0]?.detail}</p>
                </div>

                <div className="air-card">
                  <span>Calidad del aire</span>
                  <strong>{weather.airQuality?.usAqi ?? '--'} AQI</strong>
                  <small className={`tone-${aqiInfo.tone}`}>{aqiInfo.label}</small>
                </div>

                <button
                  className={`favorite-button ${isFavorite ? 'is-active' : ''}`}
                  type="button"
                  onClick={toggleFavorite}
                >
                  {isFavorite ? 'Favorito guardado' : 'Guardar favorito'}
                </button>
              </aside>
            </section>

            <section className="metrics-grid" aria-label="Metricas actuales">
              {metrics.map((metric) => (
                <article className="metric-card" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.detail}</p>
                </article>
              ))}
            </section>

            <section className="section-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Proximas horas</p>
                  <h2>Pronostico de 24 horas</h2>
                </div>
                <span>Probabilidad de lluvia y viento</span>
              </div>

              <div className="hourly-strip">
                {weather.hourly.slice(0, 24).map((hour) => {
                  const hourInfo = getWeatherInfo(hour.weather_code);

                  return (
                    <article className="hour-card" key={hour.time}>
                      <span>{formatHour(hour.time)}</span>
                      <strong>{formatTemp(hour.temperature_2m)}</strong>
                      <div>{renderConditionMark(hourInfo, 'small')}</div>
                      <small>{hour.precipitation_probability ?? 0}% lluvia</small>
                      <small>{formatWind(hour.wind_speed_10m)}</small>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="section-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Semana</p>
                  <h2>7 dias de pronostico</h2>
                </div>
                <span>Maximas, minimas y lluvia</span>
              </div>

              <div className="forecast-grid">
                {weather.daily.map((day) => {
                  const dayInfo = getWeatherInfo(day.weather_code);
                  const rain = day.precipitation_probability_max ?? 0;

                  return (
                    <article className="forecast-card" key={day.time}>
                      <div>
                        <span>{formatDay(day.time)}</span>
                        <strong>{dayInfo.label}</strong>
                      </div>
                      <div className="forecast-icon" aria-hidden="true">
                        {renderConditionMark(dayInfo, 'medium')}
                      </div>
                      <div className="forecast-temp">
                        <strong>{formatTemp(day.temperature_2m_max)}</strong>
                        <span>{formatTemp(day.temperature_2m_min)}</span>
                      </div>
                      <div className="rain-track">
                        <span style={{ width: `${rain}%` }} />
                      </div>
                      <small>{rain}% lluvia</small>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="insight-grid" aria-label="Recomendaciones inteligentes">
              {insights.map((insight) => (
                <article className="insight-card" key={insight.title}>
                  <span>{insight.title}</span>
                  <strong>{insight.value}</strong>
                  <p>{insight.detail}</p>
                </article>
              ))}
            </section>

            {favorites.length > 0 && (
              <section className="favorites-panel" aria-label="Ciudades favoritas">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Favoritos</p>
                    <h2>Tus ciudades</h2>
                  </div>
                </div>

                <div className="favorite-list">
                  {favorites.map((place) => (
                    <button
                      key={`${place.id}-${place.latitude}-${place.longitude}`}
                      type="button"
                      onClick={() => loadPlace(place)}
                    >
                      {place.label}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default App;
