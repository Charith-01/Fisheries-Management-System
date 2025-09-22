import axios from "axios";

export const getWeather = async (req, res) => {
  try {
    const lat = Number(req.query.lat ?? 6.9570);   
    const lon = Number(req.query.lon ?? 80.1918);
    const timezone = "auto";                       

    // normal weather 
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
      timezone
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
      timezone
    };

    // api calls 
    const [weatherRes, marineRes] = await Promise.all([
      axios.get(weatherUrl, { params: weatherParams }),
      axios.get(marineUrl, { params: marineParams })
    ]);

    const weather = weatherRes.data;
    const marine  = marineRes.data;

    // response ekata tidy structure ekak
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
      units: {
        weather: weather.hourly_units,
        marine: marine.hourly_units
      },
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch weather/marine data" });
  }
};
