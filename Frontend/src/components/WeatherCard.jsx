import { useEffect, useState } from "react";
import { fetchCurrentWeather } from "../api/weather";

const WMO = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  56: "Freezing drizzle (light)", 57: "Freezing drizzle (dense)",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Freezing rain (light)", 67: "Freezing rain (heavy)",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm (hail)", 99: "Severe thunderstorm (hail)"
};

export default function WeatherCard({ lat = 6.9570, lon = 80.1918, title = "Current Weather", darkMode }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setState({ loading: true, error: null });
        const d = await fetchCurrentWeather({ lat, lon });
        if (on) setData(d);
      } catch (e) {
        if (on) setState({ loading: false, error: e.message || "Error" });
      } finally {
        if (on) setState(s => ({ ...s, loading: false }));
      }
    })();
    return () => { on = false; };
  }, [lat, lon]);

  const shell = (children) => (
    <div className={`rounded-2xl p-6 shadow ring-1 ${
      darkMode ? "bg-slate-800/90 ring-slate-700 text-slate-100" : "bg-white/80 ring-slate-200 text-slate-800"
    }`}>
      {children}
    </div>
  );

  if (state.loading) return shell(<div>Loading weather…</div>);
  if (state.error)   return shell(<div className="text-red-600">⚠️ {state.error}</div>);
  if (!data?.current) return shell(<div>No data</div>);

  const c = data.current;
  const codeText = WMO[c.weathercode] ?? `Code ${c.weathercode}`;
  const when = new Date(c.time).toLocaleString();

  const times = data.marine?.time || data.hourly?.time || [];
  const idx = nearestIndex(times, c.time);

  // safe getters
  const pick = (arr, i) => (Array.isArray(arr) && arr[i] != null ? arr[i] : null);

 
  const wu = data.units?.weather || {};
  const mu = data.units?.marine || {};
  const u = {
    temp: "°C",
    wind: "km/h",
    gust: wu.windgusts_10m || "km/h",
    wave: mu.wave_height || "m",
    swell: mu.swell_wave_height || "m",
    period: mu.wave_period || "s",
    vis: wu.visibility || "m"
  };

  // values
  const gust = pick(data.hourly?.windgusts_10m, idx);
  const waveH = pick(data.marine?.wave_height, idx);
  const swellH = pick(data.marine?.swell_wave_height, idx);
  const waveP = pick(data.marine?.wave_period, idx);

  const risk = getRisk({ waveH, gust });

  return shell(
    <>
      <div className="mb-2 flex items-start justify-between">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-xs opacity-70">
            lat {Number(data.location.lat).toFixed(3)}, lon {Number(data.location.lon).toFixed(3)} • {data.location.timezone || ""}
          </span>
        </div>

        <span className={
          "rounded-full px-3 py-1 text-xs font-semibold " +
          (risk.color === "red" ? "bg-red-100 text-red-700" :
           risk.color === "amber" ? "bg-amber-100 text-amber-700" :
           "bg-emerald-100 text-emerald-700")
        }>
          {risk.label}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="Temperature" value={`${c.temperature}${u.temp}`} />
        <Metric label="Wind Speed" value={`${c.windspeed} ${u.wind}`} />
        <Metric label="Wind Direction" value={`${c.winddirection}°`} />
      </div>

      <div className="mt-3 text-sm font-medium">{codeText}</div>
      <div className="mt-1 text-xs opacity-70">Updated: {when}</div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold">Marine (Nearest hour)</h4>
        {times.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Wave H" value={formatVal(waveH, u.wave)} />
            <Metric label="Swell H" value={formatVal(swellH, u.swell)} />
            <Metric label="Wave Period" value={formatVal(waveP, u.period)} />
            <Metric label="Wind Gusts" value={formatVal(gust, u.gust)} />
          </div>
        ) : (
          <div className="text-xs opacity-70">Marine data not available</div>
        )}
      </div>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-gray-50 p-4 dark:bg-slate-700/40">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-gray-500 dark:text-slate-300">{label}</span>
    </div>
  );
}
function formatVal(v, unit) {
  if (v == null) return "—";
  const num = typeof v === "number" ? v : Number(v);
  return `${Number.isFinite(num) ? num.toFixed(1) : v} ${unit}`;
}
function nearestIndex(times, targetISO) {
  if (!Array.isArray(times) || !times.length) return 0;
  const t = new Date(targetISO || Date.now()).getTime();
  let best = 0, bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(new Date(times[i]).getTime() - t);
    if (d < bestDiff) { best = i; bestDiff = d; }
  }
  return best;
}
function getRisk({ waveH, gust }) {
  const w = Number(waveH ?? NaN);
  const g = Number(gust ?? NaN); 

  // thresholds (simple): >2.0 m waves OR >50 km/h gusts → No-Go
  if ((Number.isFinite(w) && w > 2.0) || (Number.isFinite(g) && g > 50)) {
    return { label: "NO-GO", color: "red" };
  }
  // caution: 1–2 m waves OR >35 km/h gusts
  if ((Number.isFinite(w) && w > 1.0) || (Number.isFinite(g) && g > 35)) {
    return { label: "Caution", color: "amber" };
  }
  return { label: "OK", color: "green" };
}
