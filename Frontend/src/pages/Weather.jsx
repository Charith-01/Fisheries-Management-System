import { useEffect, useState } from "react";
import { Crosshair, MapPin, RefreshCcw } from "lucide-react";
import WeatherCard from "../components/WeatherCard";

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

  // GPS try karanna
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const useGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => alert("Location fail. Using selected harbor.")
    );
  };

  const onSelectHarbor = (e) => {
    const h = HARBORS.find(x => x.name === e.target.value);
    if (h) {
      setHarbor(h.name);
      setCoords({ lat: h.lat, lon: h.lon });
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <div className="space-y-4">
      
      <div className={`rounded-2xl p-4 shadow ring-1 ${darkMode ? "bg-slate-800/90 ring-slate-700" : "bg-white/80 ring-slate-200"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Weather</h3>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Auto GPS or select a harbor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={harbor}
              onChange={onSelectHarbor}
              className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white"}`}
            >
              {HARBORS.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
            </select>

            <button
              onClick={useGPS}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              <Crosshair className="h-4 w-4" /> Use GPS
            </button>

            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        <div className={`mt-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          <span className="mr-2">lat {coords.lat.toFixed(4)}, lon {coords.lon.toFixed(4)}</span>
          <span className="opacity-60">(Harbor: {harbor})</span>
        </div>
      </div>

      
      <WeatherCard
        key={refreshKey}
        lat={coords.lat}
        lon={coords.lon}
        darkMode={darkMode}
        title={<span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />Current Weather</span>}
      />
    </div>
  );
}
