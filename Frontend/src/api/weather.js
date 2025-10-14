export async function fetchCurrentWeather({ lat = 6.9570, lon = 80.1918 } = {}) {
  // env → base URL resolve
  const base =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:3000";

  const token = localStorage.getItem("token") || sessionStorage.getItem("token"); // JWT thiyenawanam

  const res = await fetch(`${base}/api/weather?lat=${lat}&lon=${lon}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error((await res.text().catch(() => "")) || "Failed to fetch weather");
  }
  return res.json(); 
}
