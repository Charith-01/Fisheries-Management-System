import jwt from "jsonwebtoken";
import { generateReply } from "../services/geminiClient.js";

const memory = new Map();
const MAX_TURNS = Number(process.env.CHAT_MAX_TURNS || 10);

function getUserFromRequest(req) {
  if (req.user) return req.user; // from middleware
  try {
    const h = req.headers["authorization"];
    if (!h?.startsWith("Bearer ")) return null;
    return jwt.verify(h.slice(7), process.env.JWT_KEY);
  } catch {
    return null;
  }
}

export const postChat = async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};
    if (!sessionId || !message) return res.status(400).json({ error: "sessionId and message are required" });

    // TEMP debug logs (remove when stable)
    console.log("[chat] auth header:", req.headers["authorization"]);
    console.log("[chat] middleware req.user:", req.user);

    const user = getUserFromRequest(req);
    console.log("[chat] resolved user:", user);

    const thread = memory.get(sessionId) || [];
    thread.push({ role: "user", text: message });

    const lastFew = thread.slice(-(MAX_TURNS * 2));
    const { text } = await generateReply(lastFew, { user });

    thread.push({ role: "model", text });
    memory.set(sessionId, thread.slice(-(MAX_TURNS * 2)));

    res.json({ reply: text, sessionId });
  } catch (e) {
    console.error("Chat error:", e);
    res.status(500).json({ error: "Chat service failed" });
  }
};
