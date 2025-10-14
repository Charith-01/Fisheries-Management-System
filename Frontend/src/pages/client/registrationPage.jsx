import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import LoginImageSlider from "../../components/LoginImageSlider";

export default function RegistrationPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [address, setAddress]     = useState("");
  const [password, setPassword]   = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]     = useState(false);

  const navigate = useNavigate();

  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

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

        window.history.replaceState({}, "", "/register");
      } catch {
      }
    }
  }, [navigate]);

  function validatePassword(pwd) {
    const rules = [
      { regex: /.{8,}/, msg: "At least 8 characters" },
      { regex: /[A-Z]/, msg: "At least one uppercase letter" },
      { regex: /[a-z]/, msg: "At least one lowercase letter" },
      { regex: /[0-9]/, msg: "At least one number" },
      { regex: /[^A-Za-z0-9]/, msg: "At least one special character" },
    ];
    for (let r of rules) if (!r.regex.test(pwd)) return r.msg;
    return null;
  }

  function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!regex.test(email)) return "Invalid email format";
    return null;
  }

  function validatePhone(phone) {
    const regex = /^[0-9]{10}$/;
    if (!regex.test(phone)) return "Phone number must be 10 digits";
    return null;
  }

  function validateName(name) {
    if (name.trim().length === 0) return "Name cannot be empty";
    return null;
  }

  async function handleRegister() {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast.error(`Password requirement: ${pwdError}`);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    const firstNameError = validateName(firstName);
    if (firstNameError) {
      toast.error(firstNameError);
      return;
    }

    const lastNameError = validateName(lastName);
    if (lastNameError) {
      toast.error(lastNameError);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND}/api/customer/register`, {
        firstName,
        lastName,
        email,
        phone,
        address,
        password,
      });
      toast.success("Registration successful");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignupClick() {
    if (window.google?.accounts?.id) {
      let shown = false;
      try {
        google.accounts.id.prompt((n) => {
          if (n?.isDisplayed && n.isDisplayed()) shown = true;
        });
      } catch {}
      setTimeout(() => {
        if (!shown) {
          window.location.href = BACKEND + "/api/auth/google/start";
        }
      }, 1000);
    } else {
      window.location.href = BACKEND + "/api/auth/google/start";
    }
  }

  return (
    <div className="w-full min-h-screen md:h-screen flex flex-col md:flex-row md:overflow-hidden">
      <div className="w-full md:w-[40%] h-full bg-white flex flex-col overflow-visible md:overflow-y-auto min-h-0">
        <div className="w-full max-w-[480px] mx-auto px-5 py-8 md:py-10">
          <div className="w-[170px] h-[70px] bg-[url(/icon-512.png)] bg-cover bg-center bg-no-repeat mb-5 mx-auto" />
          <h1 className="font-semibold text-gray-700 text-xl text-center">Create Your Account</h1>
          <label className="text-gray-700 mb-5 block text-center">Register with your details</label>

          <div className="space-y-3">
            <input
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              placeholder="First Name*"
              className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center"
            />
            <input
              onChange={(e) => setLastName(e.target.value)}
              type="text"
              placeholder="Last Name*"
              className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center"
            />
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email address*"
              className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center"
            />
            <input
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="Phone number*"
              className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center"
            />
            <input
              onChange={(e) => setAddress(e.target.value)}
              type="text"
              placeholder="Address*"
              className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password*"
              className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center"
            />
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirm Password*"
              className="w-full h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center"
            />
          </div>

          <button
            onClick={handleRegister}
            className="w-full h-[50px] bg-blue-500 rounded-lg text-white cursor-pointer mt-5 hover:bg-blue-600"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <div className="flex items-center w-full my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <button
            onClick={handleGoogleSignupClick}
            className="w-full h-[50px] flex items-center justify-center gap-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>

          <p className="text-gray-700 mt-3 text-center">
            Already have an account?{" "}
            <span className="text-blue-500 cursor-pointer hover:text-blue-700 font-medium">
              <Link to="/login">Login</Link>
            </span>
          </p>

          <div className="h-6" />
        </div>
      </div>

      <div className="w-full md:w-[60%] h-[40vh] md:h-full md:sticky md:top-0 overflow-hidden">
        <LoginImageSlider />
      </div>
    </div>
  );
}
