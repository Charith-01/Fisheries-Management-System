import { useState } from "react";

const WMO = {
  0: "☀️ Clear", 1: "🌤️ Mainly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast",
  45: "🌫️ Fog", 48: "🌫️ Rime fog",
  51: "🌦️ Light drizzle", 53: "🌦️ Moderate drizzle", 55: "🌦️ Dense drizzle",
  61: "🌧️ Slight rain", 63: "🌧️ Moderate rain", 65: "🌧️ Heavy rain",
  71: "🌨️ Slight snow", 73: "🌨️ Moderate snow", 75: "🌨️ Heavy snow",
  80: "🌦️ Slight showers", 81: "🌦️ Moderate showers", 82: "🌦️ Violent showers",
  95: "⛈️ Thunderstorm", 96: "⛈️ Thunderstorm (hail)", 99: "⛈️ Severe thunderstorm"
};

export default function ForecastCard({ data, darkMode }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'

  if (!data?.daily?.time || !data.daily.time.length) {
    return (
      <div className={`rounded-2xl p-6 shadow ring-1 ${
        darkMode ? "bg-slate-800/90 ring-slate-700" : "bg-white/80 ring-slate-200"
      }`}>
        <div className="text-center text-gray-500">Loading forecast data...</div>
      </div>
    );
  }

  const daily = data.daily;
  const marineDaily = data.marine_daily;
  const units = data.units?.weather;
  const totalDays = data.forecast_days || 7;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDayRisk = (dayIndex) => {
    const waveH = marineDaily?.wave_height_max?.[dayIndex];
    const windGust = daily?.windgusts_10m_max?.[dayIndex];
    
    const w = Number(waveH ?? NaN);
    const g = Number(windGust ?? NaN);

    if ((Number.isFinite(w) && w > 2.0) || (Number.isFinite(g) && g > 50)) {
      return { label: "NO-GO", color: "red" };
    }
    if ((Number.isFinite(w) && w > 1.0) || (Number.isFinite(g) && g > 35)) {
      return { label: "Caution", color: "amber" };
    }
    return { label: "OK", color: "green" };
  };

  // Safe value getter with fallback
  const getValue = (array, index, fallback = "N/A") => {
    return array && array[index] != null ? array[index] : fallback;
  };

  // Group days by week for monthly view
  const weeklyGroups = [];
  for (let i = 0; i < daily.time.length; i += 7) {
    weeklyGroups.push(daily.time.slice(i, i + 7));
  }

  return (
    <div className={`rounded-2xl p-6 shadow ring-1 ${
      darkMode ? "bg-slate-800/90 ring-slate-700 text-slate-100" : "bg-white/80 ring-slate-200 text-slate-800"
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {totalDays}-Day Forecast ({totalDays > 7 ? 'Extended' : 'Weekly'})
        </h3>
        
        {totalDays > 7 && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'weekly' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'monthly' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              Monthly
            </button>
          </div>
        )}
      </div>

      {/* Day Selector - Different views based on mode */}
      {viewMode === 'weekly' ? (
        // Weekly View - Scrollable horizontal
        <div className="flex overflow-x-auto pb-2 mb-4 gap-1">
          {daily.time.slice(0, totalDays).map((time, index) => {
            const risk = getDayRisk(index);
            return (
              <button
                key={time}
                onClick={() => setSelectedDay(index)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px] transition-all ${
                  selectedDay === index 
                    ? darkMode ? "bg-slate-700" : "bg-slate-200" 
                    : darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-100"
                }`}
              >
                <span className="text-sm font-medium">{formatDate(time)}</span>
                <span className="text-2xl mb-1">
                  {WMO[getValue(daily.weathercode, index)]?.split(' ')[0] || '?'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  risk.color === "red" ? "bg-red-100 text-red-700" :
                  risk.color === "amber" ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"
                }`}>
                  {risk.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        // Monthly View - Grid layout
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
          {weeklyGroups.map((week, weekIndex) => (
            <div key={weekIndex} className="space-y-2">
              <div className="text-xs font-semibold text-center mb-2">Week {weekIndex + 1}</div>
              {week.map((time, dayIndex) => {
                const globalIndex = weekIndex * 7 + dayIndex;
                const risk = getDayRisk(globalIndex);
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedDay(globalIndex)}
                    className={`w-full p-2 rounded text-xs text-center ${
                      selectedDay === globalIndex 
                        ? darkMode ? "bg-slate-700" : "bg-slate-200" 
                        : darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-100"
                    }`}
                  >
                    <div>{formatDate(time).split(' ')[0]}</div>
                    <div className="text-lg">{WMO[getValue(daily.weathercode, globalIndex)]?.split(' ')[0] || '?'}</div>
                    <div className={`text-xs px-1 rounded ${
                      risk.color === "red" ? "bg-red-100 text-red-700" :
                      risk.color === "amber" ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {risk.label}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Selected Day Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <ForecastMetric 
          label="Max Temp" 
          value={`${getValue(daily.temperature_2m_max, selectedDay)}${units?.temperature_2m_max || '°C'}`}
          icon="🔥"
        />
        <ForecastMetric 
          label="Min Temp" 
          value={`${getValue(daily.temperature_2m_min, selectedDay)}${units?.temperature_2m_min || '°C'}`}
          icon="❄️"
        />
        <ForecastMetric 
          label="Precipitation" 
          value={`${getValue(daily.precipitation_sum, selectedDay)}${units?.precipitation_sum || 'mm'}`}
          icon="💧"
        />
        <ForecastMetric 
          label="Max Waves" 
          value={`${getValue(marineDaily?.wave_height_max, selectedDay)}${data.units?.marine?.wave_height_max || 'm'}`}
          icon="🌊"
        />
        <ForecastMetric 
          label="Wind Speed" 
          value={`${getValue(daily.windspeed_10m_max, selectedDay)}${units?.windspeed_10m_max || 'km/h'}`}
          icon="💨"
        />
        <ForecastMetric 
          label="Wind Gusts" 
          value={`${getValue(daily.windgusts_10m_max, selectedDay)}${units?.windgusts_10m_max || 'km/h'}`}
          icon="💨"
        />
        <ForecastMetric 
          label="UV Index" 
          value={getValue(daily.uv_index_max, selectedDay)}
          icon="☀️"
        />
        <ForecastMetric 
          label="Wind Direction" 
          value={`${getValue(daily.winddirection_10m_dominant, selectedDay)}°`}
          icon="🧭"
        />
      </div>

      {/* Weather Description */}
      <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
        <p className="text-sm">
          <strong>Weather:</strong> {WMO[getValue(daily.weathercode, selectedDay)] || 'Unknown'}
        </p>
        <p className="text-sm mt-1">
          <strong>Fishing Conditions:</strong> {getFishingRecommendation({
            waveH: marineDaily?.wave_height_max?.[selectedDay],
            gust: daily?.windgusts_10m_max?.[selectedDay]
          })}
        </p>
      </div>
    </div>
  );
}

function ForecastMetric({ label, value, icon }) {
  return (
    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-slate-700/40">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-500 dark:text-slate-300 mt-1">{label}</div>
    </div>
  );
}

function getFishingRecommendation({ waveH, gust }) {
  const w = Number(waveH ?? NaN);
  const g = Number(gust ?? NaN);

  if ((Number.isFinite(w) && w > 2.0) || (Number.isFinite(g) && g > 50)) {
    return "Poor - Avoid fishing due to dangerous conditions";
  }
  if ((Number.isFinite(w) && w > 1.0) || (Number.isFinite(g) && g > 35)) {
    return "Fair - Exercise caution, fish in protected areas";
  }
  return "Good - Favorable conditions for fishing";
}