import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import LoginImageSlider from "../components/LoginImageSlider";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleLogin() {
    setLoading(true);

    axios.post(
      (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000") + "/api/auth/login",
      {
        email: email,
        password: password
      }
    ).then((response) => {
      toast.success("Login successful");

      const { token, user } = response.data || {};
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      const r = user?.role;
      if (r === "admin") {
        navigate("/admin");
      } else if (r === "fisherman") {
        navigate("/fisherman");
      } else {
        navigate("/");
      }

    }).catch((error) => {
      toast.error(error?.response?.data?.message || "Login failed");
    }).finally(() => {
      setLoading(false);
    });
  }

  return (
    <div className="w-full min-h-screen md:h-screen flex flex-col md:flex-row md:overflow-hidden">
      {/* LEFT: same width as registration; centered content, no extra scroll */}
      <div className="w-full md:w-[40%] h-auto md:h-full bg-white flex justify-center items-center">
        <div className="w-full max-w-[480px] px-5 py-8 md:py-10 flex justify-center items-center flex-col">
          <div className="w-[170px] h-[70px] bg-[url(/icon-512.png)] bg-cover bg-center bg-no-repeat mb-5"></div>
          <h1 className="font-semibold text-gray-700 text-xl">Welcome Back!</h1>
          <label className="text-gray-700 mb-3 text-center">Log in with your Email</label>

          <input
            onChange={(e) => { setEmail(e.target.value) }}
            className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
            type="email"
            placeholder="Email address*"
          />
          <input
            onChange={(e) => { setPassword(e.target.value) }}
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

          <p className="text-gray-700 m-[5px]">
            Don't have an account?&nbsp;
            <span className="text-blue-500 cursor-pointer hover:text-blue-700 font-medium">
              <Link to={"/register"}>Register Now</Link>
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT: same sizing behavior as registration (no extra scroll, fills side) */}
      <div className="w-full md:w-[60%] h-[40vh] md:h-full md:sticky md:top-0 overflow-hidden">
        <LoginImageSlider />
      </div>
    </div>
  );
}
