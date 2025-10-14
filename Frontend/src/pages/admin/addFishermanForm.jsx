import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, User2, Anchor, Shield, X } from "lucide-react";

export default function AddFishermanForm({ darkMode }) {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [address, setAddress]     = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [position, setPosition]   = useState("crew");
  const [password, setPassword]   = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    if (e) e.preventDefault();

    if (String(password).length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in as admin");
      return;
    }

    const payload = {
      email: email.trim(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim(),
      position,
      isEmailVerified: Boolean(isEmailVerified),
      isDisabled: Boolean(isDisabled),
    };

    try {
      setSubmitting(true);
      await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/fisherman/register",
        payload,
        { headers: { Authorization: "Bearer " + token } }
      );
      toast.success("Fisherman added successfully");
      navigate("/admin/fishermen");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Fisherman adding failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`w-full min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 ${
        darkMode ? "bg-slate-900/20" : "bg-gradient-to-br from-white to-slate-50"
      }`}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl ring-1 overflow-hidden transition-shadow ${
          darkMode
            ? "ring-slate-700 bg-slate-800/90 shadow-xl"
            : "ring-slate-200 bg-white shadow-lg"
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-600" />

        <div className="px-6 pt-6">
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
            Add Fisherman
          </h1>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Fill in the details below to register a new fisherman.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                position === "skipper"
                  ? "bg-blue-600 text-white"
                  : darkMode
                    ? "bg-slate-700 text-slate-200"
                    : "bg-slate-200 text-slate-700"
              }`}
            >
              <Anchor className="h-3.5 w-3.5" />
              {position === "skipper" ? "Skipper" : "Crew"}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                isEmailVerified
                  ? "bg-emerald-600 text-white"
                  : darkMode
                    ? "bg-slate-700 text-slate-200"
                    : "bg-slate-200 text-slate-700"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isEmailVerified ? "Verified" : "Unverified"}
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isDisabled
                  ? "bg-slate-400 text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              {isDisabled ? "Disabled" : "Active"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name *" darkMode={darkMode}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                required
                placeholder="John"
                className={inputClass(darkMode)}
              />
            </FormField>

            <FormField label="Last Name *" darkMode={darkMode}>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                required
                placeholder="Doe"
                className={inputClass(darkMode)}
              />
            </FormField>

            <FormField label="Email *" darkMode={darkMode}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="john@example.com"
                className={inputClass(darkMode)}
              />
            </FormField>

            <FormField label="Phone *" darkMode={darkMode}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                required
                placeholder="+94 77 123 4567"
                className={inputClass(darkMode)}
              />
            </FormField>

            <FormField label="Address *" darkMode={darkMode} full>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                required
                placeholder="123 Coastal Road, Galle"
                className={inputClass(darkMode)}
              />
            </FormField>

            <FormField label="License Number *" darkMode={darkMode}>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                type="text"
                required
                placeholder="Government issued license number"
                className={inputClass(darkMode)}
              />
            </FormField>

            <FormField label="Position *" darkMode={darkMode}>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className={inputClass(darkMode)}
              >
                <option value="crew">Crew</option>
                <option value="skipper">Skipper</option>
              </select>
            </FormField>

            <FormField label="Password *" darkMode={darkMode}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={8}
                placeholder="Min 8 characters"
                className={inputClass(darkMode)}
              />
            </FormField>

            <FormField label="Verification & Status" darkMode={darkMode} full>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                    darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                  }`}
                >
                  <input
                    id="isEmailVerified"
                    type="checkbox"
                    checked={isEmailVerified}
                    onChange={(e) => setIsEmailVerified(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <label
                    htmlFor="isEmailVerified"
                    className={`text-sm ${darkMode ? "text-slate-200" : "text-slate-700"}`}
                  >
                    Verified
                  </label>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                    darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                  }`}
                >
                  <input
                    id="isDisabled"
                    type="checkbox"
                    checked={isDisabled}
                    onChange={(e) => setIsDisabled(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <label
                    htmlFor="isDisabled"
                    className={`text-sm ${darkMode ? "text-slate-200" : "text-slate-700"}`}
                  >
                    Disable Account
                  </label>
                </div>
              </div>
            </FormField>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/fishermen"
              className={`inline-flex w-full sm:w-1/2 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition ${
                darkMode
                  ? "ring-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "ring-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full sm:w-1/2 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add Fisherman"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, hint, children, full, darkMode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className={`mb-1 block text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
        {label}
      </label>
      {children}
      {hint && (
        <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{hint}</p>
      )}
    </div>
  );
}

function inputClass(darkMode) {
  return `w-full rounded-xl border px-3 py-2 text-sm outline-none transition
  ${darkMode
    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
  }`;
}
