import React, { useState } from "react";
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

import NotificationDashboard from "./admin/NotificationDashboard";
import Expenses from "./admin/Expenses";

//import AdminProductsPage from "./admin/products";


/**
 * Enhanced Fisheries Admin Dashboard
 */

export default function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 text-slate-800'}`}>
      <div className="mx-auto flex flex-col lg:flex-row max-w-[1400px] gap-2 sm:gap-4 p-2 sm:p-4">
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 min-w-0">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          {/* Content Area */}
          <div className="mt-4">
            <Routes>
              <Route index element={<Overview darkMode={darkMode} />} />
              <Route path="users" element={<ManageUsers darkMode={darkMode} />} />
              <Route path="products" element={<AdminProductsPage darkMode={darkMode} />} />
              <Route path="orders" element={<ViewOrders darkMode={darkMode} />} />
              <Route path="notifications" element={<NotificationDashboard darkMode={darkMode}/>} />
              <Route path="income-expense" element={<Expenses />} />
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
        <NavLink to="/admin" end className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <LayoutDashboard className="h-5 w-5" /> Overview
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <UsersIcon className="h-5 w-5" /> Users
        </NavLink>
        <NavLink to="/admin/stock" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <BarChart3 className="h-5 w-5" /> Stock
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Ship className="h-5 w-5" /> Products
        </NavLink>
        <NavLink to="/admin/income-expense" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <TrendingUp className="h-5 w-5" /> Income & Expense
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <FileCheck2 className="h-5 w-5" /> Orders
        </NavLink>
        <NavLink to="/admin/boats" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Ship className="h-5 w-5" /> Boats
        </NavLink>
        <NavLink to="/admin/equipment" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Settings className="h-5 w-5" /> Equipment
        </NavLink>
        <NavLink to="/admin/trip" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Calendar className="h-5 w-5" /> Trip
        </NavLink>
        <NavLink to="/admin/weather" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <BarChart3 className="h-5 w-5" /> Weather
        </NavLink>
        <NavLink to="/admin/notifications" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Bell className="h-5 w-5" /> Notifications
        </NavLink>
        <NavLink to="/admin/reviews" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <CreditCard className="h-5 w-5" /> Reviews
        </NavLink>
        <NavLink
          to="/admin/signout"
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

function Header({ darkMode, setDarkMode }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // NEW: profile dropdown state

  // Fake user details for dropdown
  const userName = "Admin User";
  const userEmail = "admin@example.com";
  
  const notifications = [
    { id: 1, message: "New order received from Marine Foods", time: "10 mins ago", read: false },
    { id: 2, message: "Inventory low on Atlantic Salmon", time: "2 hours ago", read: false },
    { id: 3, message: "Weather alert for fishing zone 4B", time: "5 hours ago", read: true },
  ];
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`sticky top-0 z-10 rounded-2xl ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'} p-4 shadow-xl ring-1 backdrop-blur`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Admin Dashboard</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Welcome back, Admin. Here's today's overview.</p>
        </div>
        <div className="flex items-center gap-3">

          <button
            onClick={() => setDarkMode(prev => !prev)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div className="relative">
            <input
              placeholder="Search…"
              className={`w-full sm:w-72 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 placeholder:text-slate-400'} py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-cyan-400`}
            />
            <Search className={`pointer-events-none absolute left-3 top-2.5 h-4 w-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>

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
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'} ${notification.read ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{notification.time}</p>
                    </div>
                  ))}
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
              <img
                src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=140&auto=format&fit=crop"
                alt="admin"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
              />
              <span className="text-sm font-medium">Admin</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {profileOpen && (
              <div className={`absolute right-0 top-12 z-20 w-72 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} ring-1 ${darkMode ? 'ring-slate-700' : 'ring-slate-200'}`}>
                <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{userEmail}</p>
                </div>
                <div className="p-2">
                  <Link
                    to="/admin/profile"
                    className={`w-full inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold
                      ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    <Edit className="h-4 w-4" />
                    Edit profile
                  </Link>
                </div>
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
  // Orders
  const ordersWeekly = [
    { day: "Sat", orders: 24 },
    { day: "Sun", orders: 18 },
    { day: "Mon", orders: 35 },
    { day: "Tue", orders: 46 },
    { day: "Wed", orders: 21 },
    { day: "Thu", orders: 39 },
    { day: "Fri", orders: 41 },
  ];

  // Income & Expenses
  const finance = [
    { month: "Apr", income: 24, expenses: 14 },
    { month: "May", income: 28, expenses: 18 },
    { month: "Jun", income: 32, expenses: 19 },
    { month: "Jul", income: 29, expenses: 21 },
    { month: "Aug", income: 35, expenses: 22 },
    { month: "Sep", income: 38, expenses: 25 },
  ];

  // Stock / Trips / Reviews
  const stockData = [
    { item: "Tuna", qty: 5240 },
    { item: "Salmon", qty: 3810 },
    { item: "Prawns", qty: 1560 },
    { item: "Crabs", qty: 980 },
    { item: "Sardines", qty: 4370 },
    { item: "Cod", qty: 2150 },
  ];

  const tripsData = [
    { day: "Sat", trips: 4 },
    { day: "Sun", trips: 3 },
    { day: "Mon", trips: 6 },
    { day: "Tue", trips: 7 },
    { day: "Wed", trips: 5 },
    { day: "Thu", trips: 6 },
    { day: "Fri", trips: 8 },
  ];

  const reviewsData = [
    { name: "5★", value: 56 },
    { name: "4★", value: 28 },
    { name: "3★", value: 10 },
    { name: "2★", value: 4 },
    { name: "1★", value: 2 },
  ];

  // Weather Forecast (next 7 days)
  const weatherData = [
    { day: "Sat", temp: 30, rain: 10 },
    { day: "Sun", temp: 29, rain: 20 },
    { day: "Mon", temp: 31, rain: 5 },
    { day: "Tue", temp: 28, rain: 40 },
    { day: "Wed", temp: 27, rain: 60 },
    { day: "Thu", temp: 29, rain: 25 },
    { day: "Fri", temp: 30, rain: 15 },
  ];

  const COLORS = ["#0891b2", "#0ea5e9", "#818cf8", "#22c55e", "#f97316"];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          value="234"
          sub="this week"
          change="+12%"
          positive={true}
          icon={<UsersIcon className="h-5 w-5" />}
          darkMode={darkMode}
        />
        <StatCard
          title="Orders"
          value="128"
          sub="+6 today"
          change="+5%"
          positive={true}
          icon={<FileCheck2 className="h-5 w-5" />}
          darkMode={darkMode}
        />
        <StatCard
          title="Revenue"
          value="Rs.100000.00"
          sub="last 7 days"
          change="+18%"
          positive={true}
          icon={<CreditCard className="h-5 w-5" />}
          darkMode={darkMode}
        />
        <StatCard
          title="Weather Alerts"
          value="3"
          sub="active now"
          change="+1"
          positive={false}
          icon={<BarChart3 className="h-5 w-5" />}
          darkMode={darkMode}
        />
      </div>

      {/* Orders + Income/Expenses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Orders (Area) */}
        <div className="col-span-2 rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Orders</h3>
            <div className="flex items-center gap-2">
              <button className={`rounded-lg p-1.5 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <Calendar className="h-4 w-4" />
              </button>
              <button className={`rounded-lg p-1.5 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersWeekly} margin={{ left: 6, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="orders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="day" stroke={darkMode ? '#cbd5e1' : '#64748b'} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? '#cbd5e1' : '#64748b'} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1e293b' : '#fff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#000'
                  }} 
                />
                <Area type="monotone" dataKey="orders" stroke="#06b6d4" fill="url(#orders)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income & Expenses (Dual Area) */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <h3 className="mb-4 text-base font-semibold">Income & Expenses</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finance} margin={{ left: 6, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={darkMode ? '#cbd5e1' : '#64748b'} />
                <YAxis stroke={darkMode ? '#cbd5e1' : '#64748b'} />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1e293b' : '#fff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#000'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" fill="url(#inc)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" fill="url(#exp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock, Trips, Reviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stock (Bar) */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Stock</h3>
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

        {/* Trips (Area) */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <h3 className="mb-4 text-base font-semibold">Trips</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tripsData} margin={{ left: 6, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="day" stroke={darkMode ? '#cbd5e1' : '#64748b'} />
                <YAxis stroke={darkMode ? '#cbd5e1' : '#64748b'} />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1e293b' : '#fff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#000'
                  }} 
                />
                <Area type="monotone" dataKey="trips" name="Trips" stroke="#818cf8" fill="url(#trips)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reviews (Pie) */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <h3 className="mb-4 text-base font-semibold">Reviews</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={reviewsData} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={48} 
                  outerRadius={80} 
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{ fill: darkMode ? '#e2e8f0' : '#4b5563', fontSize: '12px' }}
                >
                  {reviewsData.map((entry, index) => (
                    <Cell key={`r-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1e293b' : '#fff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#000'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather Forecast */}
        <div
          className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
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

/* Minimal shells for pages so you can add CRUDs later */
function ManageUsers({ darkMode }) {
  return (
    <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}>
      <h3 className="text-lg font-bold">Users</h3>
    </div>
  );
}

function ViewOrders({ darkMode }) {
  return (
    <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}>
      <h3 className="text-lg font-bold">Orders</h3>
    </div>
  );
}

function StatCard({ title, value, sub, change, positive, icon, darkMode }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
      darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
    }`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-2 text-white shadow">
          {icon}
        </div>
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
  return (
    <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'}`}>
      <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Page not found.</p>
    </div>
  );
}
