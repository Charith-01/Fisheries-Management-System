import { useState, useEffect } from "react";
import api from "../api/axios"; 
import { NavLink, Route, Routes, Link } from "react-router-dom";
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

export default function FishermanDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 text-slate-800'}`}>
      <div className="mx-auto flex flex-col lg:flex-row max-w-[1400px] gap-2 sm:gap-4 p-2 sm:p-4">
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 min-w-0">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} user={user} />
          {/* Content Area */}
          <div className="mt-4">
            <Routes>
              <Route index element={<Overview darkMode={darkMode} />} />
              <Route path="stock" element={<StockPage darkMode={darkMode} />} />
              <Route path="weather" element={<WeatherPage darkMode={darkMode} />} />
              <Route path="trip" element={<TripPage darkMode={darkMode} />} />
              <Route path="profile" element={<ProfilePage darkMode={darkMode} />} />
              <Route path="*" element={<NotFound darkMode={darkMode} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ----------------------------- UI Pieces ------------------------------ */

function Sidebar({ darkMode, setDarkMode }) {
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
        <NavLink to="/fisherman/trip" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Calendar className="h-5 w-5" /> Trip
        </NavLink>
        <NavLink
          to="/fisherman/signout"
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

function Header({ darkMode, setDarkMode, user  }) {
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

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div
                className={`absolute right-0 top-12 z-20 w-80 rounded-xl shadow-lg ${
                  darkMode ? "bg-slate-800" : "bg-white"
                } ring-1 ${
                  darkMode ? "ring-slate-700" : "ring-slate-200"
                } max-h-96 overflow-y-auto`}
              >
                <div
                  className={`p-4 border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleMarkAsRead(notification._id)}
                      className={`p-4 border-b cursor-pointer ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-700"
                          : "border-slate-100 hover:bg-slate-50"
                      } ${notification.isRead ? "opacity-70" : ""}`}
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs">{notification.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
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
      {/* ... same as your code ... */}
    </div>
  );
}

function StockPage({ darkMode }) {
  return <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}><h3 className="text-lg font-bold">Stock</h3></div>;
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
