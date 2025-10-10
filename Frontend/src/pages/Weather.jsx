import { useEffect, useState } from "react";
import { Crosshair, MapPin, RefreshCcw, AlertCircle } from "lucide-react";
import WeatherCard from "../components/WeatherCard";
import ForecastCard from "../components/forecastCard";
import { fetchCurrentWeather } from "../api/weather";

const HARBORS = [
  { name: "Colombo", lat: 6.9271, lon: 79.8612 },
  { name: "Negombo", lat: 7.2083, lon: 79.8358 },
  { name: "Galle", lat: 6.0535, lon: 80.2210 },
  { name: "Trincomalee", lat: 8.5711, lon: 81.2335 },
  { name: "Jaffna", lat: 9.6615, lon: 80.0255 },
];

export default function Weather({ darkMode }) {
  const DEF_LAT = Number(import.meta.env.VITE_DEFAULT_LAT ?? 6.9570);
  const DEF_LON = Number(import.meta.env.VITE_DEFAULT_LON ?? 80.1918);

  const [coords, setCoords] = useState({ lat: DEF_LAT, lon: DEF_LON });
  const [refreshKey, setRefreshKey] = useState(0);
  const [harbor, setHarbor] = useState(HARBORS[0].name);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Fetch weather data when coords or refreshKey changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchCurrentWeather({ lat: coords.lat, lon: coords.lon });
        setWeatherData(data);
        setGpsError(null); // Clear any previous GPS errors on successful fetch
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coords, refreshKey]);

  const useGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setIsGettingLocation(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { 
          lat: pos.coords.latitude, 
          lon: pos.coords.longitude 
        };
        setCoords(newCoords);
        setHarbor("GPS Location");
        setIsGettingLocation(false);
        
        console.log("GPS Location obtained:", newCoords);
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Failed to get your location. ";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        
        setGpsError(errorMessage);
        console.error("GPS Error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 600000 // 10 minutes
      }
    );
  };

  const onSelectHarbor = (e) => {
    const h = HARBORS.find(x => x.name === e.target.value);
    if (h) {
      setHarbor(h.name);
      setCoords({ lat: h.lat, lon: h.lon });
      setGpsError(null); // Clear GPS errors when selecting a harbor
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    setGpsError(null);
  };

  return (
    <div className="space-y-4">
      
      {/* Control Panel */}
      <div className={`rounded-2xl p-4 shadow ring-1 ${darkMode ? "bg-slate-800/90 ring-slate-700" : "bg-white/80 ring-slate-200"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Weather & Forecast</h3>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Auto GPS or select a harbor. 7-day forecast available.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={harbor}
              onChange={onSelectHarbor}
              className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white"}`}
            >
              {HARBORS.map(h => (
                <option key={h.name} value={h.name}>{h.name}</option>
              ))}
              <option value="GPS Location">GPS Location</option>
            </select>

            <button
              onClick={useGPS}
              disabled={isGettingLocation}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isGettingLocation 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : darkMode 
                    ? "bg-slate-700 text-white hover:bg-slate-600" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Crosshair className={`h-4 w-4 ${isGettingLocation ? "animate-spin" : ""}`} /> 
              {isGettingLocation ? "Locating..." : "Use GPS"}
            </button>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        <div className={`mt-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          <span className="mr-2">lat {coords.lat.toFixed(4)}, lon {coords.lon.toFixed(4)}</span>
          <span className="opacity-60">(Location: {harbor})</span>
        </div>

        {/* GPS Error Display */}
        {gpsError && (
          <div className={`mt-3 flex items-center gap-2 rounded-lg p-3 text-sm ${
            darkMode ? "bg-red-900/30 text-red-200" : "bg-red-50 text-red-700"
          }`}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Current Weather */}
      {loading ? (
        <div className={`rounded-2xl p-6 shadow ring-1 ${
          darkMode ? "bg-slate-800/90 ring-slate-700 text-slate-100" : "bg-white/80 ring-slate-200 text-slate-800"
        }`}>
          <div className="text-center">Loading weather data...</div>
        </div>
      ) : weatherData ? (
        <>
          <WeatherCard
            data={weatherData}
            darkMode={darkMode}
            title={<span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />Current Weather</span>}
          />

          {/* Forecast */}
          <ForecastCard 
            data={weatherData} 
            darkMode={darkMode} 
          />
        </>
      ) : (
        <div className={`rounded-2xl p-6 shadow ring-1 ${
          darkMode ? "bg-slate-800/90 ring-slate-700 text-slate-100" : "bg-white/80 ring-slate-200 text-slate-800"
        }`}>
          <div className="text-center text-red-600">Failed to load weather data</div>
        </div>
      )}
    </div>
  );
}