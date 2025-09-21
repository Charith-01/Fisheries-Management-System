// src/pages/client/registrationPage.jsx
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import LoginImageSlider from "../../components/LoginImageSlider";

export default function RegistrationPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function validatePassword(pwd) {
    const rules = [
      { regex: /.{8,}/, msg: "At least 8 characters" },
      { regex: /[A-Z]/, msg: "At least one uppercase letter" },
      { regex: /[a-z]/, msg: "At least one lowercase letter" },
      { regex: /[0-9]/, msg: "At least one number" },
      { regex: /[^A-Za-z0-9]/, msg: "At least one special character" },
    ];

    for (let r of rules) {
      if (!r.regex.test(pwd)) {
        return r.msg;
      }
    }
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

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/customer/register`, {
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
