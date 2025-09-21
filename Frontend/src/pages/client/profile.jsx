import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Lock, 
  CheckCircle, 
  Edit3,
  Camera,
  ArrowLeft,
  ShoppingCart,
  Package,
  Bell
} from "lucide-react";
import Footer from "../../components/footer";

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

function Toast({ kind = "success", msg = "", onClose }) {
  if (!msg) return null;
  return (
    <div className={classNames(
      "fixed bottom-6 right-6 z-50 rounded-xl px-6 py-4 shadow-xl text-sm flex items-center animate-fade-in",
      kind === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
    )}>
      <CheckCircle className="h-5 w-5 mr-2" />
      <span>{msg}</span>
      <button onClick={onClose} className="ml-4 opacity-80 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center py-3 border-b border-slate-100 last:border-0">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-800 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

const TABS = [
  { id: "Overview", icon: User },
  { id: "Personal Info", icon: Edit3 },
  { id: "Address", icon: MapPin },
  { id: "Security", icon: Shield }
];

export default function Profile() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [toast, setToast] = useState({ kind: "success", msg: "" });

  const [info, setInfo] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [addr, setAddr] = useState({ address: "" });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const [avatar, setAvatar] = useState("");
  const fileRef = useRef(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const initials = useMemo(() => {
    const f = (me?.firstName || "").trim();
    const l = (me?.lastName || "").trim();
    if (f || l) return `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();
    if (me?.email) return me.email[0]?.toUpperCase() || "U";
    return "U";
  }, [me]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/customer/me");
        const customer = data?.customer || null;
        if (ignore) return;
        setMe(customer);
        if (customer) {
          setInfo({
            firstName: customer.firstName || "",
            lastName: customer.lastName || "",
            email: customer.email || "",
            phone: customer.phone || "",
          });
          setAddr({ address: customer.address || "" });
        }
      } catch (e) {
        navigate("/login");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [navigate]);

  const saveInfo = async () => {
    try {
      const payload = {
        firstName: info.firstName,
        lastName: info.lastName,
        phone: info.phone,
        address: addr.address,
      };
      const { data } = await api.put("/api/customer/me", payload);
      setMe(data.customer);
      setToast({ kind: "success", msg: "Profile updated successfully" });
    } catch {
      setToast({ kind: "error", msg: "Couldn't update profile" });
    }
  };

  const saveAddress = async () => {
    try {
      const { data } = await api.put("/api/customer/me", { address: addr.address });
      setMe(data.customer);
      setToast({ kind: "success", msg: "Address saved successfully" });
    } catch {
      setToast({ kind: "error", msg: "Couldn't save address" });
    }
  };

  const changePassword = async () => {
    if (!pwd.newPassword || pwd.newPassword.length < 8) {
      setToast({ kind: "error", msg: "New password must be at least 8 characters" });
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      setToast({ kind: "error", msg: "Passwords do not match" });
      return;
    }
    try {
      await api.post("/api/customer/change-password", {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setToast({ kind: "success", msg: "Password changed successfully" });
    } catch {
      setToast({ kind: "error", msg: "Couldn't change password" });
    }
  };

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result?.toString() || "");
    reader.readAsDataURL(file);
  };

  const clearAuth = () => {
    const keys = ["customer","user","auth","auth_user","token","authToken","access_token","jwt","refresh_token"];
    keys.forEach(k => localStorage.removeItem(k));
  };

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      await api.delete("/api/customer/me", { data: { confirm: true } });
      setShowDelete(false);
      setToast({ kind: "success", msg: "Your account has been deleted" });
      clearAuth();
      navigate("/register");
    } catch {
      setToast({ kind: "error", msg: "Couldn't delete account" });
    } finally {
      setDeleting(false);
      setDeleteText("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-40 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-slate-200 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Authentication Required</h3>
          <p className="text-slate-500 mb-6">Please log in to access your profile</p>
          <div className="flex flex-col gap-3">
            <Link 
              to="/login" 
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-6xl mx-auto px-4 pt-8">

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <div className="relative">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="h-24 w-24 rounded-2xl object-cover ring-4 ring-blue-100" 
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center text-3xl font-bold ring-4 ring-blue-100">
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-slate-600" />
                  </button>
                  <input ref={fileRef} onChange={onPickAvatar} type="file" accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {me.firstName ? `Welcome, ${me.firstName}!` : "Your Profile"}
                    </h1>
                    <p className="text-slate-500 flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2" />
                      {me.email}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Customer
                  </span>
                </div>

                <div className="flex overflow-x-auto scrollbar-hide">
                  <div className="inline-flex gap-1 bg-slate-100 rounded-xl p-1">
                    {TABS.map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={classNames(
                          "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                          tab === id 
                            ? "bg-white shadow-sm text-blue-600" 
                            : "text-slate-600 hover:text-slate-800"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Summary</h3>
                <div className="space-y-1">
                  <InfoRow icon={User} label="Full Name" value={`${me.firstName || ""} ${me.lastName || ""}`.trim()} />
                  <InfoRow icon={Mail} label="Email" value={me.email} />
                  <InfoRow icon={Phone} label="Phone" value={me.phone} />
                  <InfoRow icon={MapPin} label="Address" value={me.address} />
                  <InfoRow icon={Calendar} label="Member Since" value={new Date(me.createdAt || Date.now()).toLocaleDateString()} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 min-h-[455px]">
                {tab === "Overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">Account Overview</h3>
                      <p className="text-slate-500">
                        Manage your personal information, security settings, and delivery preferences
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <div className="flex items-center mb-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="font-medium text-slate-800">Primary Address</h4>
                        </div>
                        <p className="text-slate-600">
                          {me.address || "No address saved yet"}
                        </p>
                        <button 
                          onClick={() => setTab("Address")}
                          className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
                        >
                          Update address
                        </button>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <div className="flex items-center mb-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mr-3">
                            <Shield className="h-5 w-5 text-slate-600" />
                          </div>
                          <h4 className="font-medium text-slate-800">Security</h4>
                        </div>
                        <p className="text-slate-600">
                          Last password change: <span className="text-slate-800 font-medium">Recently</span>
                        </p>
                        <button 
                          onClick={() => setTab("Security")}
                          className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
                        >
                          Change password
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h4 className="font-medium text-slate-800 mb-3">Quick Stats</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">12</div>
                          <div className="text-sm text-slate-500">Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">4.8</div>
                          <div className="text-sm text-slate-500">Avg. Rating</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "Personal Info" && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                        <input
                          value={info.firstName}
                          onChange={(e) => setInfo((p) => ({ ...p, firstName: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                        <input
                          value={info.lastName}
                          onChange={(e) => setInfo((p) => ({ ...p, lastName: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Last name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={info.email}
                          onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="you@example.com"
                          disabled
                        />
                        <p className="text-xs text-slate-500 mt-2">Email cannot be changed</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                        <input
                          value={info.phone}
                          onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="+94 7X XXX XXXX"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex items-center gap-3">
                      <button 
                        onClick={saveInfo} 
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() =>
                          setInfo({
                            firstName: me.firstName || "",
                            lastName: me.lastName || "",
                            email: me.email || "",
                            phone: me.phone || "",
                          })
                        }
                        className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Discard Changes
                      </button>
                    </div>
                  </div>
                )}

                {tab === "Address" && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">Delivery Address</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Address</label>
                      <textarea
                        rows={4}
                        value={addr.address}
                        onChange={(e) => setAddr({ address: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Street, city, region, postal code"
                      />
                    </div>
                    <div className="mt-8 flex items-center gap-3">
                      <button 
                        onClick={saveAddress} 
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => setAddr({ address: me.address || "" })}
                        className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}

                {tab === "Security" && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">Change Password</h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={pwd.currentPassword}
                          onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Enter your current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={pwd.newPassword}
                          onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="At least 8 characters"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={pwd.confirmPassword}
                          onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Re-type your new password"
                        />
                      </div>
                    </div>
                    <div className="mt-8">
                      <button 
                        onClick={changePassword} 
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                      >
                        Update Password
                      </button>
                    </div>

                    <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-red-600 mt-1">
                            Permanently delete your account and all related data.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDelete(true)}
                          className="px-4 py-2 rounded-xl border border-red-300 bg-white text-red-700 font-medium hover:bg-red-100 transition"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Toast
          kind={toast.kind}
          msg={toast.msg}
          onClose={() => setToast({ kind: "success", msg: "" })}
        />
      </main>

      <Footer />

      {showDelete && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowDelete(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-[fadeIn_120ms_ease-out]">
              <div className="px-6 py-5 border-b bg-gradient-to-r from-red-50 to-rose-50">
                <h3 className="text-lg font-semibold text-slate-900">Are you sure you want to delete?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  This action cannot be undone. Type <span className="font-semibold text-red-600">DELETE</span> to confirm.
                </p>
              </div>
              <div className="px-6 py-5">
                <input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500 transition"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Your account and associated data will be permanently removed.
                </p>
              </div>
              <div className="px-6 pb-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting || deleteText !== "DELETE"}
                  className={classNames(
                    "px-4 py-2 rounded-xl font-semibold text-white transition",
                    deleting || deleteText !== "DELETE"
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
