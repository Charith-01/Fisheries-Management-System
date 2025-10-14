import React, { useState, useEffect } from "react";
import { NavLink, Route, Routes, Link, useNavigate } from "react-router-dom";
import {
  Fish,
  Ship,
  Users as UsersIcon,
  FileCheck2,
  LayoutDashboard,
  Settings,
  LogOut,
  CreditCard,
  BarChart3,
  TrendingUp,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  Gauge,
  Plus
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import FishStockList from "./FishStockList.jsx";
import { fishStockService } from "../services/fishStockService";
import toast from "react-hot-toast";
import api from "../api/axios";
import FishStockListFisherman from "./FishStockListFisherman";
import CreateFishStockFisherman from "./CreateFishStockFisherman";
import EditFishStockFisherman from "./EditFishStockFisherman";
import DepthSensor from "./DepthSensor.jsx";
import { useAuth } from "../contexts/AuthContext";

export default function FishermanDashboard() {
  const { user } = useAuth(); 
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
 
 
  // minimal, safe auth clear (doesn't touch other app state)
  function clearAuthFromStorage() {
    const keys = [
      "customer",
      "user",
      "auth",
      "auth_user",
      "token",
      "authToken",
      "access_token",
      "jwt",
      "refresh_token",
    ];
    let changed = false;
    for (const k of keys) {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        changed = true;
      }
    }
    if (changed) {
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: "auth", newValue: null }));
      } catch {}
    }
  }

  const handleLogoutConfirm = () => {
    clearAuthFromStorage();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  return (
    <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 text-slate-800'}`}>
      <div className="mx-auto flex flex-col lg:flex-row max-w-[1400px] gap-2 sm:gap-4 p-2 sm:p-4">
        <Sidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          onLogoutRequest={() => setShowLogoutConfirm(true)} 
          user={user}
        />
        <main className="flex-1 min-w-0">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} user={user} />
          {/* Content Area */}
          <div className="mt-4">
            <Routes>
              <Route index element={<Overview darkMode={darkMode} />} />
              <Route path="stock" element={<FishStockListFisherman darkMode={darkMode} />} />
              <Route path="weather" element={<WeatherPage darkMode={darkMode} />} />
              <Route path="trip" element={<TripPage darkMode={darkMode} />} />
              <Route path="profile" element={<ProfilePage darkMode={darkMode} />} />
              <Route path="*" element={<NotFound darkMode={darkMode} />} />
              <Route path="stock/create" element={<CreateFishStockFisherman />} />
              <Route path="stock/edit/:id" element={<EditFishStockFisherman />} />
              <Route path="depth-sensor" element={<DepthSensor darkMode={darkMode} />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Logout confirmation modal (modern, minimal) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl ring-1 ${
            darkMode ? 'bg-slate-800 ring-slate-700' : 'bg-white ring-slate-200'
          }`}>
            <div className={`p-5 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Sign out?
              </h3>
              <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-sm mt-1`}>
                You'll be logged out of the fisherman dashboard and redirected to the login page.
              </p>
            </div>
            <div className="p-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- UI Pieces ------------------------------ */

function Sidebar({ darkMode, setDarkMode, onLogoutRequest, user }) {
  const linkBase =
    "group flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-300 hover:translate-x-1";
  const active = "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md";
  const idle = `${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-white/70'}`;

  return (
    <aside
      className={`lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] h-auto w-full lg:w-[280px] shrink-0 rounded-2xl 
        ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'} 
        p-3 sm:p-4 shadow-xl ring-1 backdrop-blur overflow-visible lg:overflow-y-auto`}
    >
      <div className="flex items-center justify-center mb-4 gap-2">
        <img
          src="/logo-dashboard.png"
          alt="Logo"
          className="h-12 w-32 sm:h-14 sm:w-36 object-contain rounded-lg"
        />
      </div>
      <nav className="space-y-2">
        <NavLink to="/fisherman" end className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <LayoutDashboard className="h-5 w-5" /> Overview
        </NavLink>
        <NavLink to="/fisherman/stock" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <TrendingUp className="h-5 w-5" /> Stock
        </NavLink>
        <NavLink to="/fisherman/weather" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <BarChart3 className="h-5 w-5" /> Weather
        </NavLink>
        <NavLink to="/fisherman/depth-sensor" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
        <Gauge className="h-5 w-5" /> Depth Sensor
       </NavLink>
        <NavLink to="/fisherman/trip" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Calendar className="h-5 w-5" /> Trip
        </NavLink>
        
        <NavLink
          to="/fisherman/signout"
          onClick={(e) => {
            e.preventDefault();
            onLogoutRequest && onLogoutRequest();
          }}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-300
            ${isActive 
              ? 'bg-red-600 text-white shadow-md' 
              : darkMode 
                ? 'text-red-500 hover:bg-red-600 hover:text-white' 
                : 'text-red-600 hover:bg-red-600 hover:text-white'
            }`
          }
        >
          <LogOut className="h-5 w-5" /> Sign out
        </NavLink>
      </nav>
    </aside>
  );
}

function initials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Header({ darkMode, setDarkMode, user }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read", err);
    }
  };

  return (
    <header className={`sticky top-0 z-10 rounded-2xl ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'} p-4 shadow-xl ring-1 backdrop-blur`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Fisherman Dashboard</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Quick view of stock & weather.</p>
        </div>
        <div className="flex items-center gap-3">

          <button
            onClick={() => setDarkMode(prev => !prev)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Search */}
          <div className="relative">
            <input
              placeholder="Search…"
              className={`w-full sm:w-72 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 placeholder:text-slate-400'} py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-cyan-400`}
            />
            <Search className={`pointer-events-none absolute left-3 top-2.5 h-4 w-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative rounded-xl p-2 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className={`absolute right-0 top-12 z-20 w-80 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} ring-1 ${darkMode ? 'ring-slate-700' : 'ring-slate-200'}`}>
                <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No notifications</p>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification._id} 
                        onClick={() => handleMarkAsRead(notification._id)}
                        className={`p-4 border-b cursor-pointer ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'} ${notification.isRead ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs">{notification.message}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2">
                  <button className={`w-full text-center text-sm py-2 rounded-lg ${darkMode ? 'text-cyan-400 hover:bg-slate-700' : 'text-cyan-600 hover:bg-slate-100'}`}>
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile chip + dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 rounded-xl ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} px-3 py-2`}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "fisherman"}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center text-xs font-semibold ring-2 ring-white">
                  {initials(user?.name || "Fisherman")}
                </div>
              )}
              <span className="text-sm font-medium">{user?.name || "Fisherman"}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {profileOpen && (
              <div className={`absolute right-0 top-12 z-20 w-72 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} ring-1 ${darkMode ? 'ring-slate-700' : 'ring-slate-200'}`}>
                <div className={`p-4 ${darkMode ? 'border-b border-slate-700' : 'border-b border-slate-200'}`}>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{user?.name || "Fisherman"}</p>
                  {user?.email ? (
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                  ) : null}
                </div>
                {/* Edit profile option removed as requested */}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

/* ----------------------------- Pages ------------------------------ */

function Overview({ darkMode }) {
  const stockData = [
    { item: "Tuna", qty: 1240 },
    { item: "Salmon", qty: 880 },
    { item: "Prawns", qty: 360 },
    { item: "Crabs", qty: 190 },
    { item: "Sardines", qty: 1370 },
    { item: "Cod", qty: 450 },
  ];
  const weatherData = [
    { day: "Sat", temp: 30, rain: 10 },
    { day: "Sun", temp: 29, rain: 20 },
    { day: "Mon", temp: 31, rain: 5 },
    { day: "Tue", temp: 28, rain: 40 },
    { day: "Wed", temp: 27, rain: 60 },
    { day: "Thu", temp: 29, rain: 25 },
    { day: "Fri", temp: 30, rain: 15 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Stock Items" value="6" sub="tracked" change="+2%" positive={true} icon={<BarChart3 className="h-5 w-5" />} darkMode={darkMode} />
        <StatCard title="Upcoming Weather Alerts" value="3" sub="next 7 days" change="+1" positive={false} icon={<FileCheck2 className="h-5 w-5" />} darkMode={darkMode} />
        <StatCard title="Total Trips" value="14" sub="Past 90 days" change="+4%" positive={true} icon={<Calendar className="h-5 w-5" />} darkMode={darkMode} />
        <StatCard title="Active Days at Sea" value="18" sub="this month" change="+3" positive={true} icon={<Ship className="h-5 w-5" />} darkMode={darkMode} />
      </div>

      {/* Stock + Weather */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stock (Bar) */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Current Stock</h3>
            <Filter className="h-4 w-4" />
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="item" stroke={darkMode ? '#cbd5e1' : '#64748b'} />
                <YAxis stroke={darkMode ? '#cbd5e1' : '#64748b'} />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1e293b' : '#fff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#000'
                  }} 
                />
                <Bar dataKey="qty" name="Quantity (kg)" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather Forecast */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Weather Forecast</h3>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Next 7 days (°C)
            </span>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weatherData} margin={{ left: 6, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="day" stroke={darkMode ? '#cbd5e1' : '#64748b'} />
                <YAxis
                  yAxisId="left"
                  stroke={darkMode ? '#cbd5e1' : '#64748b'}
                  tickFormatter={(v) => `${v}°`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={darkMode ? '#cbd5e1' : '#64748b'}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: darkMode ? '#1e293b' : '#fff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#000'
                  }}
                  formatter={(value, name) =>
                    name === 'temp' ? [`${value}°C`, 'Temp'] : [`${value}%`, 'Rain chance']
                  }
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  name="Temp"
                  stroke="#06b6d4"
                  fill="url(#tempGrad)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="rain"
                  name="Rain chance"
                  stroke="#818cf8"
                  fill="url(#rainGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherPage({ darkMode }) {
  return <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}><h3 className="text-lg font-bold">Weather</h3></div>;
}
function TripPage({ darkMode }) {
  return <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}><h3 className="text-lg font-bold">Trip</h3></div>;
}
function ProfilePage({ darkMode }) {
  return <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}><h3 className="text-lg font-bold">Profile</h3></div>;
}
function StatCard({ title, value, sub, change, positive, icon, darkMode }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
      darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
    }`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-2 text-white shadow">{icon}</div>
        <span className={`text-xs font-medium ${positive ? 'text-green-500' : 'text-red-500'}`}>{change}</span>
      </div>
      <p className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
      <p className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</p>
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan-50 opacity-20" />
    </div>
  );
}
function NotFound({ darkMode }) {
  return <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}><p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Page not found.</p></div>;
}