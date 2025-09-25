import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import LoginImageSlider from "../components/LoginImageSlider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const navigate = useNavigate();

  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // --- Capture backend redirect (?token=...&user=...) and finish login ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    const u = params.get("user");
    if (t && u) {
      try {
        localStorage.setItem("token", t);
        const user = JSON.parse(u);
        localStorage.setItem("user", JSON.stringify(user));

        const r = user?.role;
        if (r === "admin") navigate("/admin");
        else if (r === "fisherman") navigate("/fisherman");
        else navigate("/");

        // Clean query params
        window.history.replaceState({}, "", "/login");
      } catch {
        // ignore parse errors
      }
    }
  }, [navigate]);

  // ------------------ Normal login ------------------
  function handleLogin() {
    setLoading(true);

    axios
      .post(BACKEND + "/api/auth/login", { email, password })
      .then((response) => {
        toast.success("Login successful");

        const { token, user } = response.data || {};
        if (token) localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));

        const r = user?.role;
        if (r === "admin") navigate("/admin");
        else if (r === "fisherman") navigate("/fisherman");
        else navigate("/");
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Login failed");
      })
      .finally(() => setLoading(false));
  }

  // ------------------ Google login (robust) ------------------
  // Ensure GIS script is present/loaded
  useEffect(() => {
    if (window.google && window.google.accounts?.id) {
      setGisReady(true);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setGisReady(true), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => setGisReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    /* global google */
    if (!gisReady || !CLIENT_ID || !window.google) return;
    try {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleGoogleResponse,
        ux_mode: "popup",
        itp_support: true,
        use_fedcm_for_prompt: true,
      });
    } catch (e) {
      console.warn("Google init failed:", e);
    }
  }, [gisReady, CLIENT_ID]);

  async function handleGoogleResponse(response) {
    try {
      const idToken = response?.credential;
      if (!idToken) {
        toast.error("Google login failed: No token received");
        return;
      }

      const res = await axios.post(
        BACKEND + "/api/auth/google/id-token",
        { id_token: idToken }
      );

      toast.success("Google login successful");

      const { token, user } = res.data || {};
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      const r = user?.role;
      if (r === "admin") navigate("/admin");
      else if (r === "fisherman") navigate("/fisherman");
      else navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Google login failed");
    }
  }

  // On click: try GIS prompt; if suppressed, fallback to backend redirect flow
  function handleGoogleLoginClick() {
    /* global google */
    if (gisReady && window.google?.accounts?.id) {
      let shown = false;
      try {
        google.accounts.id.prompt((notification) => {
          if (notification?.isDisplayed && notification.isDisplayed()) shown = true;
        });
      } catch {}
      setTimeout(() => {
        if (!shown) window.location.href = BACKEND + "/api/auth/google/start";
      }, 1000);
    } else {
      window.location.href = BACKEND + "/api/auth/google/start";
    }
  }

  return (
    <div className="w-full min-h-screen md:h-screen flex flex-col md:flex-row md:overflow-hidden">
      <div className="w-full md:w-[40%] h-auto md:h-full bg-white flex justify-center items-center">
        <div className="w-full max-w-[480px] px-5 py-8 md:py-10 flex justify-center items-center flex-col">
          <div className="w-[170px] h-[70px] bg-[url(/icon-512.png)] bg-cover bg-center bg-no-repeat mb-5"></div>
          <h1 className="font-semibold text-gray-700 text-xl">Welcome Back!</h1>
          <label className="text-gray-700 mb-3 text-center">Log in with your Email</label>

          <input
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
            type="email"
            placeholder="Email address*"
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
            type="password"
            placeholder="Password*"
          />

          <button
            onClick={handleLogin}
            className="w-full h-[50px] bg-blue-500 rounded-lg text-white cursor-pointer m-[15px] hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>

          {/* Divider */}
          <div className="flex items-center w-full my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          {/* Google Login Button (UI unchanged) */}
          <button
            onClick={handleGoogleLoginClick}
            className="w-full h-[50px] flex items-center justify-center gap-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>

          <p className="text-gray-700 m-[5px]">
            Don't have an account?&nbsp;
            <span className="text-blue-500 cursor-pointer hover:text-blue-700 font-medium">
              <Link to={"/register"}>Register Now</Link>
            </span>
          </p>
        </div>
      </div>

      <div className="w-full md:w-[60%] h-[40vh] md:h-full md:sticky md:top-0 overflow-hidden">
        <LoginImageSlider />
      </div>
    </div>
  );
}
