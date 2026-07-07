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
    // El almacenamiento local puede estar bloqueado en navegadores privados.
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

const getDisplayPlaceName = (place) => {
  if (!place) return '';

  const parts = [place.name];
  const region = place.admin1 && place.admin1 !== place.name ? place.admin1 : '';

  if (region && region.length <= 18) parts.push(region);
  if (place.country) parts.push(place.country);

  return parts.filter(Boolean).join(', ');
};

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

const renderConditionMark = (weatherInfo, size = 'large') => (
  <span
    className={`condition-mark condition-mark-${size} condition-${weatherInfo.tone}`}
    aria-label={weatherInfo.label}
    role="img"
    title={weatherInfo.label}
  />
);

const LoadingView = () => (
  <section className="loading-state" aria-live="polite" aria-label="Cargando clima">
    <div className="skeleton skeleton-main" />
    <div className="skeleton-grid">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  </section>
);

const EmptyView = () => (
  <section className="empty-state">
    <p className="eyebrow">Consulta disponible</p>
    <h2>Busca una ciudad para iniciar el panel meteorológico.</h2>
    <p>
      La información se actualiza desde Open-Meteo y no requiere credenciales ni
      configuración adicional.
    </p>
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
  const selectedPlaceLabel = weather?.place.label;
  const selectedPlaceDisplay = getDisplayPlaceName(weather?.place);

  const applyWeather = useCallback((data) => {
    setWeather(data);
    setQuery(getDisplayPlaceName(data.place));
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
            'No fue posible actualizar el pronóstico. Verifica tu conexión e intenta nuevamente.',
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

    if (
      text.length < 2 ||
      text === selectedPlaceLabel ||
      text === selectedPlaceDisplay
    ) {
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
  }, [query, selectedPlaceDisplay, selectedPlaceLabel]);

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
      setError('Tu navegador no permite usar geolocalización.');
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
        setError('No fue posible acceder a tu ubicación. Puedes buscar la ciudad manualmente.');
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
  const displayPlaceName = selectedPlaceDisplay;

  const metrics = useMemo(() => {
    if (!current) return [];

    return [
      {
        label: 'Sensación térmica',
        value: formatTemp(current.apparent_temperature),
        detail:
          Math.abs(current.apparent_temperature - current.temperature_2m) < 2
            ? 'Similar a la temperatura real'
            : 'La percepción difiere del registro',
      },
      {
        label: 'Humedad',
        value: `${current.relative_humidity_2m ?? '--'}%`,
        detail:
          current.relative_humidity_2m >= 70
            ? 'Ambiente con alta humedad'
            : 'Humedad en rango manejable',
      },
      {
        label: 'Viento',
        value: formatWind(current.wind_speed_10m),
        detail: `${getWindDirection(current.wind_direction_10m)} con ráfagas de ${formatWind(
          current.wind_gusts_10m,
        )}`,
      },
      {
        label: 'Presión',
        value: `${Math.round(current.pressure_msl ?? 0)} hPa`,
        detail: 'Medida a nivel medio del mar',
      },
      {
        label: 'Nubosidad',
        value: `${current.cloud_cover ?? '--'}%`,
        detail: current.cloud_cover > 65 ? 'Cielo mayormente cubierto' : 'Cielo parcialmente abierto',
      },
      {
        label: 'Precipitación',
        value: `${current.precipitation ?? 0} mm`,
        detail:
          current.precipitation > 0 ? 'Registro activo de lluvia' : 'Sin lluvia registrada',
      },
      {
        label: 'Índice UV',
        value: Math.round(today?.uv_index_max ?? weather?.airQuality?.uvIndex ?? 0),
        detail: getUvInfo(today?.uv_index_max ?? weather?.airQuality?.uvIndex),
      },
      {
        label: 'Calidad del aire',
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
        title: rainProbability >= 50 ? 'Planifica con cobertura' : 'Operación sin lluvia crítica',
        value: `${rainProbability}%`,
        detail: nextRainHour
          ? `Mayor probabilidad desde las ${formatHour(nextRainHour.time)}`
          : 'Sin bloque de lluvia relevante en las próximas horas',
      },
      {
        title: highUv ? 'Protección solar recomendada' : 'Radiación bajo control',
        value: getUvInfo(today.uv_index_max),
        detail: `Índice UV máximo estimado: ${Math.round(today.uv_index_max ?? 0)}`,
      },
      {
        title: strongWind ? 'Atención a ráfagas' : 'Viento estable',
        value: formatWind(current.wind_gusts_10m),
        detail: `Dirección dominante ${getWindDirection(current.wind_direction_10m)}`,
      },
      {
        title: 'Ventana de luz natural',
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

  const keyFacts = current
    ? [
        {
          label: 'Sensación',
          value: formatTemp(current.apparent_temperature),
        },
        {
          label: 'Humedad',
          value: `${current.relative_humidity_2m ?? '--'}%`,
        },
        {
          label: 'Viento',
          value: formatWind(current.wind_speed_10m),
        },
      ]
    : [];

  return (
    <main className={`app-shell ${theme}`}>
      <div className="app-container">
        <header className="topbar">
          <div className="brand-area">
            <span className="brand-logo" aria-hidden="true">
              MP
            </span>
            <div>
              <p className="eyebrow">MeteoPanel</p>
              <h1>Monitoreo meteorológico en tiempo real</h1>
              <p>
                Pronóstico, calidad del aire y recomendaciones operativas en una
                interfaz clara para tomar decisiones diarias.
              </p>
            </div>
          </div>

          <div className="topbar-actions">
            <button className="secondary-button" type="button" onClick={toggleUnit}>
              {unit === 'celsius' ? 'Mostrar °F' : 'Mostrar °C'}
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={handleUseMyLocation}
              disabled={geoLoading}
            >
              {geoLoading ? 'Detectando ubicación' : 'Usar mi ubicación'}
            </button>
          </div>
        </header>

        <section className="search-panel" aria-label="Consulta meteorológica">
          <div className="search-intro">
            <p className="eyebrow">Consulta</p>
            <h2>Selecciona una ubicación</h2>
            <p>Busca cualquier ciudad o utiliza una de las ubicaciones sugeridas.</p>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <label htmlFor="city-search">Ciudad o país</label>
            <div className="search-row">
              <input
                id="city-search"
                type="search"
                value={query}
                placeholder="Ej. Santo Domingo, Madrid, Tokio"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="primary-button" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Consultando' : 'Consultar'}
              </button>
            </div>

            {(suggestions.length > 0 || isSuggesting) && (
              <div className="suggestions" role="listbox">
                {isSuggesting && <span className="suggestion-muted">Buscando ubicaciones...</span>}
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

          <div className="quick-row" aria-label="Accesos rápidos">
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
            <section className="dashboard-grid">
              <article className="current-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Condiciones actuales</p>
                    <h2>{displayPlaceName}</h2>
                    {weather.place.label !== displayPlaceName && (
                      <p className="place-detail">{weather.place.label}</p>
                    )}
                    <p className="updated-at">
                      Actualizado {formatDateTime(current.time)} ·{' '}
                      {weather.timezoneAbbreviation || weather.timezone}
                    </p>
                  </div>

                  <div className="condition-summary">
                    {renderConditionMark(weatherInfo)}
                    <span>{weatherInfo.label}</span>
                  </div>
                </div>

                <div className="current-body">
                  <div className="temperature-stack">
                    <span>{formatTemp(current.temperature_2m)}</span>
                    <p>Se percibe como {formatTemp(current.apparent_temperature)}</p>
                  </div>

                  <div className="fact-grid">
                    {keyFacts.map((fact) => (
                      <div className="fact-card" key={fact.label}>
                        <span>{fact.label}</span>
                        <strong>{fact.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="time-strip">
                  <span>Amanecer {formatHour(today?.sunrise)}</span>
                  <span>Atardecer {formatHour(today?.sunset)}</span>
                  <span>Dirección {getWindDirection(current.wind_direction_10m)}</span>
                </div>
              </article>

              <aside className="advisory-panel">
                <div>
                  <p className="eyebrow">Recomendación</p>
                  <h3>{insights[0]?.title}</h3>
                  <p>{insights[0]?.detail}</p>
                </div>

                <div className="advisory-list">
                  <div>
                    <span>Riesgo de lluvia</span>
                    <strong>{today?.precipitation_probability_max ?? 0}%</strong>
                  </div>
                  <div>
                    <span>Índice UV</span>
                    <strong>{getUvInfo(today?.uv_index_max)}</strong>
                  </div>
                  <div>
                    <span>Calidad del aire</span>
                    <strong>{weather.airQuality?.usAqi ?? '--'} AQI</strong>
                    <small className={`tone-${aqiInfo.tone}`}>{aqiInfo.label}</small>
                  </div>
                </div>

                <button
                  className={`favorite-button ${isFavorite ? 'is-active' : ''}`}
                  type="button"
                  onClick={toggleFavorite}
                >
                  {isFavorite ? 'Ubicación guardada' : 'Guardar ubicación'}
                </button>
              </aside>
            </section>

            <section className="metrics-grid" aria-label="Indicadores meteorológicos">
              {metrics.map((metric) => (
                <article className="metric-card" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.detail}</p>
                </article>
              ))}
            </section>

            <section className="content-grid">
              <article className="forecast-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Próximas 24 horas</p>
                    <h2>Evolución horaria</h2>
                  </div>
                  <span>Temperatura, lluvia y viento</span>
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
              </article>

              <article className="forecast-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Semana</p>
                    <h2>Pronóstico extendido</h2>
                  </div>
                  <span>Máximas, mínimas y lluvia</span>
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
              </article>
            </section>

            <section className="insight-grid" aria-label="Recomendaciones operativas">
              {insights.map((insight) => (
                <article className="insight-card" key={insight.title}>
                  <span>{insight.title}</span>
                  <strong>{insight.value}</strong>
                  <p>{insight.detail}</p>
                </article>
              ))}
            </section>

            {favorites.length > 0 && (
              <section className="favorites-panel" aria-label="Ubicaciones guardadas">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Guardadas</p>
                    <h2>Ubicaciones frecuentes</h2>
                  </div>
                </div>

                <div className="favorite-list">
                  {favorites.map((place) => (
                    <button
                      key={`${place.id}-${place.latitude}-${place.longitude}`}
                      type="button"
                      onClick={() => loadPlace(place)}
                    >
                      {getDisplayPlaceName(place)}
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
