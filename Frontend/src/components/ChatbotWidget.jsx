import { useEffect, useMemo, useRef, useState } from "react";
import { sendChat } from "../api/chat";

function getOrCreateSessionId() {
  let id = localStorage.getItem("fms_chat_sid");
  if (!id) {
    id = (crypto.randomUUID?.() || `sid_${Math.random().toString(36).slice(2)}`);
    localStorage.setItem("fms_chat_sid", id);
  }
  return id;
}

function getCookie(name) {
  const m = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[2]) : null;
}

function getAuthToken() {
  const keys = [
    "jwtToken", "token", "authToken", "access_token", "accessToken",
    "id_token", "userToken", "bearer", "Authorization"
  ];
  for (const store of [localStorage, sessionStorage]) {
    for (const k of keys) {
      const v = store.getItem(k);
      if (v) return v;
    }
  }
  for (const k of ["jwt", "token", "authToken", "access_token"]) {
    const v = getCookie(k);
    if (v) return v;
  }
  return null;
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false); // NEW: keep panel mounted while closing
  const [spin, setSpin] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msgs, setMsgs] = useState(() => ([
    { from: "bot", text: "Hi! I'm your Fisheries Assistant. Ask about products, stock, payments, office info" }
  ]));

  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const token = useMemo(() => {
    const raw = getAuthToken();
    return raw?.startsWith("Bearer ") ? raw.slice(7) : raw;
  }, [open]);

  const bottomRef = useRef(null);
  const lastSendAtRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send(textOverride) {
    const now = Date.now();
    if (now - lastSendAtRef.current < 400) return;
    lastSendAtRef.current = now;

    const text = (textOverride ?? input).trim();
    if (!text || busy) return;

    setMsgs(m => [...m, { from: "you", text }]);
    setInput("");
    setBusy(true);
    setError("");

    try {
      const { reply } = await sendChat({ message: text, sessionId, token });
      setMsgs(m => [...m, { from: "bot", text: reply }]);
    } catch (e) {
      setError("Couldn't reach the chat service. Please check your connection and try again.");
      setMsgs(m => [...m, { from: "bot", text: "Sorry, I couldn't reach the chat service. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function QuickChip({ label, prompt }) {
    return (
      <button
        onClick={() => send(prompt)}
        disabled={busy}
        className="px-3 py-2 text-xs font-medium text-blue-900 bg-white border border-blue-200 rounded-full transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-600 hover:to-teal-600 hover:text-white hover:border-transparent hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {label}
      </button>
    );
  }

  const SPIN_MS = 600;
  const PANEL_ANIM_MS = 280; // NEW: close animation duration (match CSS)

  function handleFabClick() {
    if (open) {
      // NEW: trigger graceful close animation
      setClosing(true);
      setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, PANEL_ANIM_MS);
      return;
    }
    if (!spin) {
      setSpin(true);
      setTimeout(() => {
        setSpin(false);
        setOpen(true);
      }, SPIN_MS);
    }
  }

  return (
    <>
      {/* Floating icon button - Only chatbot icon, no background */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-10 right-10 z-50 p-0 border-none bg-transparent cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
        disabled={spin}
      >
        {open ? (
          /* Small chatbot icon while open (no ×) */
          <img
            src="/chatbot.png"
            alt="Close chat"
            className="w-12 h-12"
          />
        ) : (
          <img
            src="/chatbot.png"
            alt="Chatbot"
            className={`w-20 h-20 ${spin ? 'animate-spin-once' : 'animate-float'}`}
          />
        )}
      </button>

      {/* Chat panel */}
      {(open || closing) && (
        <div
          className={`fixed bottom-24 right-6 w-96 max-w-[92vw] h-[520px] max-h-[70vh] bg-white rounded-2xl shadow-2xl shadow-blue-900/30 flex flex-col overflow-hidden z-40 border border-blue-100 backdrop-blur-sm
          ${closing ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}
        >
          {/* Header */}
          <div className="px-5 py-4 font-bold border-b border-blue-100 bg-gradient-to-r from-blue-700 to-teal-600 text-white text-lg flex items-center gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-wave"></div>
            <span className="text-xl">🐟</span>
            <span className="relative z-10">Customer Assistant</span>
          </div>

          {/* Quick chips */}
          <div className="px-4 py-4 border-b border-blue-50 bg-gradient-to-b from-blue-50 to-cyan-50 flex gap-2 flex-wrap">
            <QuickChip label="Browse products" prompt="Show me available products with price and stock." />
            <QuickChip label="Today's stock" prompt="How much stock do you have for prawns and tuna today?" />
            <QuickChip label="Office info" prompt="What is your office location, hours, and phone number?" />
            <QuickChip label="Payment options" prompt="What payment methods do you accept?" />
            {token && <QuickChip label="My orders" prompt="Show my recent orders." />}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(42,157,143,0.03)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(34,84,136,0.03)_0%,transparent_50%)] pointer-events-none"></div>
            
            {msgs.map((m, i) => (
              <div 
                key={i} 
                className={`flex mb-4 ${m.from === 'you' ? 'justify-end' : 'justify-start'} ${
                  m.from === 'bot' ? 'animate-message-slide-in' : 'animate-message-slide-in-right'
                }`}
              >
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap word-wrap-break-word leading-relaxed shadow-md ${
                  m.from === 'bot' 
                    ? 'bg-white border border-blue-200 rounded-bl-md text-blue-900' 
                    : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-br-md'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {busy && (
              <div className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-200 rounded-2xl shadow-md max-w-fit mb-4">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-typing-dots"></div>
                  <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-typing-dots" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-typing-dots" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs text-blue-900">Assistant is typing...</span>
              </div>
            )}
            
            {error && (
              <div className="mt-2 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                {error}
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>

          {/* Input area - No placeholder */}
          <div className="px-4 py-4 border-t border-blue-100 bg-white flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              className="flex-1 resize-none rounded-2xl px-4 py-3 border-2 border-blue-200 bg-blue-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all duration-200"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="px-5 py-3 rounded-2xl border-none bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-1"
            >
              Send
              <span className="text-lg">↑</span>
            </button>
          </div>
        </div>
      )}

      {/* Tailwind CSS animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes spin-once {
          0% { transform: rotate(0deg) scale(1); opacity: 1; }
          60% { transform: rotate(300deg) scale(1.1); opacity: 0.8; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }
        @keyframes slide-in-up {
          from { transform: translateY(20px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        /* NEW: closing animation */
        @keyframes slide-out-down {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to { transform: translateY(20px) scale(0.96); opacity: 0; }
        }
        @keyframes message-slide-in {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes message-slide-in-right {
          from { transform: translateX(10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes typing-dots {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        @keyframes wave {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-spin-once {
          animation: spin-once 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* NEW */
        .animate-slide-out-down {
          animation: slide-out-down 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-message-slide-in {
          animation: message-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-message-slide-in-right {
          animation: message-slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-typing-dots {
          animation: typing-dots 1.4s infinite ease-in-out;
        }
        .animate-wave {
          animation: wave 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
