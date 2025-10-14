import axios from "axios";

export const getWeather = async (req, res) => {
  try {
    const lat = Number(req.query.lat ?? 6.9570);   
    const lon = Number(req.query.lon ?? 80.1918);
    const timezone = "auto";                       

    // Enhanced weather API call with extended forecast
    const weatherUrl = "https://api.open-meteo.com/v1/forecast";
    const weatherParams = {
      latitude: lat,
      longitude: lon,
      current_weather: true,
      hourly: [
        "windspeed_10m",
        "windgusts_10m",
        "winddirection_10m",
        "precipitation_probability",
        "precipitation",
        "visibility"
      ].join(","),
      daily: [
        "weathercode",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "windspeed_10m_max",
        "windgusts_10m_max",
        "winddirection_10m_dominant",
        "uv_index_max",
        "sunrise",
        "sunset"
      ].join(","),
      timezone,
      forecast_days: 16 // Maximum free forecast days
    };

    const marineUrl = "https://marine-api.open-meteo.com/v1/marine";
    const marineParams = {
      latitude: lat,
      longitude: lon,
      hourly: [
        "wave_height",
        "wave_direction",
        "wave_period",
        "swell_wave_height",
        "swell_wave_direction",
        "swell_wave_period",
        "wind_wave_height",
        "wind_wave_direction",
        "wind_wave_period"
      ].join(","),
      daily: [
        "wave_height_max",
        "wave_direction_dominant",
        "wave_period_max",
        "swell_wave_height_max",
        "wind_wave_height_max"
      ].join(","),
      timezone,
      forecast_days: 16 // Match weather forecast days
    };

    // API calls 
    const [weatherRes, marineRes] = await Promise.all([
      axios.get(weatherUrl, { params: weatherParams }),
      axios.get(marineUrl, { params: marineParams })
    ]);

    const weather = weatherRes.data;
    const marine = marineRes.data;

    // Enhanced response with forecast data
    res.json({
      location: { lat, lon, timezone },
      current: weather.current_weather,
      hourly: {
        time: weather.hourly?.time,
        windspeed_10m: weather.hourly?.windspeed_10m,
        windgusts_10m: weather.hourly?.windgusts_10m,
        winddirection_10m: weather.hourly?.winddirection_10m,
        precipitation_probability: weather.hourly?.precipitation_probability,
        precipitation: weather.hourly?.precipitation,
        visibility: weather.hourly?.visibility
      },
      daily: {
        time: weather.daily?.time,
        weathercode: weather.daily?.weathercode,
        temperature_2m_max: weather.daily?.temperature_2m_max,
        temperature_2m_min: weather.daily?.temperature_2m_min,
        precipitation_sum: weather.daily?.precipitation_sum,
        precipitation_probability_max: weather.daily?.precipitation_probability_max,
        windspeed_10m_max: weather.daily?.windspeed_10m_max,
        windgusts_10m_max: weather.daily?.windgusts_10m_max,
        winddirection_10m_dominant: weather.daily?.winddirection_10m_dominant,
        uv_index_max: weather.daily?.uv_index_max,
        sunrise: weather.daily?.sunrise,
        sunset: weather.daily?.sunset
      },
      marine: {
        time: marine.hourly?.time,
        wave_height: marine.hourly?.wave_height,
        wave_direction: marine.hourly?.wave_direction,
        wave_period: marine.hourly?.wave_period,
        swell_wave_height: marine.hourly?.swell_wave_height,
        swell_wave_direction: marine.hourly?.swell_wave_direction,
        swell_wave_period: marine.hourly?.swell_wave_period,
        wind_wave_height: marine.hourly?.wind_wave_height,
        wind_wave_direction: marine.hourly?.wind_wave_direction,
        wind_wave_period: marine.hourly?.wind_wave_period
      },
      marine_daily: {
        time: marine.daily?.time,
        wave_height_max: marine.daily?.wave_height_max,
        wave_direction_dominant: marine.daily?.wave_direction_dominant,
        wave_period_max: marine.daily?.wave_period_max,
        swell_wave_height_max: marine.daily?.swell_wave_height_max,
        wind_wave_height_max: marine.daily?.wind_wave_height_max
      },
      units: {
        weather: { ...weather.hourly_units, ...weather.daily_units },
        marine: { ...marine.hourly_units, ...marine.daily_units }
      },
      forecast_days: 16, 
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch weather/marine data" });
  }
};