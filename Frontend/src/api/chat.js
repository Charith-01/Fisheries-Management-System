export async function sendChat({ message, sessionId, token }) {
  const base =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:3000";

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // TEMP debug: see what we’re sending (remove later)
  console.log("[chat] token present?", !!token);
  console.log("[chat] Authorization header:", headers.Authorization?.slice(0, 28) + "...");

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, sessionId })
  });

  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);
  return res.json(); // { reply, sessionId }
}
