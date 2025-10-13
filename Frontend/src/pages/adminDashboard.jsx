import React, { useState, useEffect } from "react";
import { NavLink, Route, Routes, Link, useNavigate } from "react-router-dom";
import TripsManagement from "./TripsManagement.jsx";
import AddTripForm from "./AddTripForm.jsx";
import EditTripForm from "./EditTripForm.jsx";
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
import FishStockList from "./FishStockList.jsx";
import AdminProductsPage from "./admin/products";
import AddProductForm from "./admin/addProductForm";
import UpdateProductForm from "./admin/updateProductForm";
import AddBoatForm from "./admin/addBoatForm.jsx";
import BoatsManagement from "./admin/boatManagement.jsx";
import EditBoatForm from "./admin/editBoatForm.jsx";
import BoatDetail from "./admin/boatDetails.jsx";
import EquipmentManagement from "./admin/equipmentManagement.jsx";
import AddEquipmentForm from "./admin/addEquipmentForm.jsx";
import EditEquipmentForm from "./admin/editEquipmentForm.jsx";
import EquipmentDetails from "./admin/equipmentDetails.jsx";
import AdminCustomersPage from "./admin/customers.jsx";
import AdminFishermenPage from "./admin/fishermen.jsx";
import AddFishermanForm from "./admin/addFishermanForm.jsx";
import UpdateFishermanForm from "./admin/updateFishermanForm.jsx";
import axios from "axios";
import AdminOrdersPage from "./admin/orders.jsx";
import AdminReviewsPage from "./admin/reviews.jsx";
import { Gauge } from "lucide-react";
import DepthSensor from "./DepthSensor.jsx";
import { useRoleAccess,clearAllAuthData  } from "../hook/useRoleAccess";

export default function AdminDashboard() {
  useRoleAccess("admin");
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogoutConfirm = () => {
    clearAllAuthData(); // Use the centralized function
    setShowLogoutConfirm(false);
    navigate("/login");
  };
  
  return (
    <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 text-slate-800'}`}>
      <div className="mx-auto flex flex-col lg:flex-row max-w-[1400px] gap-2 sm:gap-4 p-2 sm:p-4">
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} onLogoutRequest={() => setShowLogoutConfirm(true)} />
        <main className="flex-1 min-w-0">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          <div className="mt-4">
            <Routes>
              <Route index element={<Overview darkMode={darkMode} />} />
              <Route path="users" element={<AdminCustomersPage darkMode={darkMode} />} />
              <Route path="fishermen" element={<AdminFishermenPage darkMode={darkMode} />} />
              <Route path="products" element={<AdminProductsPage darkMode={darkMode} />} />
              <Route path="addFisherman" element={<AddFishermanForm darkMode={darkMode} />} />
              <Route path="updateFisherman" element={<UpdateFishermanForm darkMode={darkMode} />} />
              <Route path="orders" element={<AdminOrdersPage darkMode={darkMode} />} />
              <Route path="trip" element={<TripsManagement darkMode={darkMode} />} />
              <Route path="trip/add" element={<AddTripForm darkMode={darkMode} />} />
              <Route path="trip/edit/:tripId" element={<EditTripForm darkMode={darkMode} />} />
              <Route path="stock" element={<FishStockList darkMode={darkMode} />} />
              <Route path="addProduct" element={<AddProductForm darkMode={darkMode} />} />
              <Route path="updateProduct" element={<UpdateProductForm darkMode={darkMode} />} />
              <Route path="notifications" element={<NotificationDashboard darkMode={darkMode}/>} />
              <Route path="expense" element={<Expenses />} />
              <Route path="boats" element={<BoatsManagement darkMode={darkMode} />} />
              <Route path="boats/addBoat" element={<AddBoatForm darkMode={darkMode} />} />
              <Route path="boats/editBoat/:boatNumber" element={<EditBoatForm darkMode={darkMode} />} />
              <Route path="boats/:boatNumber" element={<BoatDetail darkMode={darkMode} />} />
              <Route path="equipment" element={<EquipmentManagement darkMode={darkMode} />} />
              <Route path="equipment/addEquipment" element={<AddEquipmentForm darkMode={darkMode} />} />
              <Route path="equipment/editEquipment/:equipmentID" element={<EditEquipmentForm darkMode={darkMode} />} />
              <Route path="equipment/:equipmentID" element={<EquipmentDetails darkMode={darkMode} />} />
              <Route path="reviews" element={<AdminReviewsPage darkMode={darkMode} />} />
               <Route path="depth-sensor" element={<DepthSensor darkMode={darkMode} />} />
              <Route path="*" element={<NotFound darkMode={darkMode} />} />
            </Routes>
          </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl ring-1 ${
            darkMode ? 'bg-slate-800 ring-slate-700' : 'bg-white ring-slate-200'
          }`}>
            <div className={`p-5 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sign out?</h3>
              <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-sm mt-1`}>
                You'll be logged out of the admin dashboard and redirected to the login page.
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

function Sidebar({ darkMode, setDarkMode, onLogoutRequest }) {
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
        <img src="/logo-dashboard.png" alt="Logo" className="h-12 w-32 sm:h-14 sm:w-36 object-contain rounded-lg" />
      </div>
      <nav className="space-y-2">
        <NavLink to="/admin" end className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <LayoutDashboard className="h-5 w-5" /> Overview
        </NavLink>

        <NavLink to="/admin/users" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <UsersIcon className="h-5 w-5" /> Customers
        </NavLink>

        <NavLink to="/admin/fishermen" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <UsersIcon className="h-5 w-5" /> Fishermen
        </NavLink>

        <NavLink to="/admin/stock" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <BarChart3 className="h-5 w-5" /> Stock
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <Ship className="h-5 w-5" /> Products
        </NavLink>
        
        <NavLink to="/admin/expense" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          <TrendingUp className="h-5 w-5" /> Income & Expences
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
        <NavLink to="/admin/depth-sensor" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
        <Gauge className="h-5 w-5" /> Depth Sensor
        </NavLink>
        <NavLink
          to="/admin/signout"
          onClick={(e) => { e.preventDefault(); onLogoutRequest && onLogoutRequest(); }}
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", avatar: "" });

  useEffect(() => {
    const tryKeys = ["admin", "user", "auth_user", "auth"];
    let raw = null;
    for (const k of tryKeys) {
      const v = localStorage.getItem(k);
      if (v) { raw = v; break; }
    }
    let obj = null;
    try { obj = raw ? JSON.parse(raw) : null; } catch { obj = null; }
    const candidate = obj?.user || obj?.admin || obj?.data || obj || null;

    const first = candidate?.firstName || candidate?.firstname || "";
    const last  = candidate?.lastName  || candidate?.lastname  || "";
    const combinedName = candidate?.name || candidate?.fullName || `${first} ${last}`.trim() || candidate?.username || "";
    const email  = candidate?.email || candidate?.mail || candidate?.userEmail || "";
    const avatar = candidate?.avatar || candidate?.photoURL || candidate?.image || candidate?.profilePic || candidate?.avatarUrl || "";

    setUserInfo({ name: combinedName || "Admin", email: email || "", avatar: avatar || "" });
  }, []);

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
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className={`relative rounded-xl p-2 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
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
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 border-b ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'} ${n.read ? 'opacity-70' : ''}`}>
                      <p className="text-sm">{n.message}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{n.time}</p>
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

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 rounded-xl ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} px-3 py-2`}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center text-xs font-semibold ring-2 ring-white">
                AD
              </div>
              <span className="text-sm font-medium">Admin</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- Pages ------------------------------ */

function Overview({ darkMode }) {
  const [customerCount, setCustomerCount] = useState(0);
  const [fishermanCount, setFishermanCount] = useState(0);

  useEffect(() => {
    let timer;
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: "Bearer " + token } : undefined;

        const [custRes, fishRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/customer/all`, { headers }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/fisherman/all`, { headers }),
        ]);

        const custList = Array.isArray(custRes?.data?.customers) ? custRes.data.customers : [];
        const fishList = Array.isArray(fishRes?.data?.fishermen)
          ? fishRes.data.fishermen
          : Array.isArray(fishRes?.data)
          ? fishRes.data
          : [];

        setCustomerCount(custList.length);
        setFishermanCount(fishList.length);
      } catch (err) {
        console.error("Failed to fetch counts", err);
      }
    };

    fetchCounts();
    timer = setInterval(fetchCounts, 30000);
    return () => clearInterval(timer);
  }, []);

  // -------- Orders data (real) --------
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [ordersWeekly, setOrdersWeekly] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  useEffect(() => {
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: "Bearer " + token } : undefined;

        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/order/all`, { headers });
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.orders || []);
        setOrdersList(list);
        setOrdersTotal(list.length);

        const todayStart = startOfDay(new Date());
        const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const todayCount = list.filter((o) => {
          const od = o?.date ? new Date(o.date) : null;
          return od && od >= todayStart && od < tomorrowStart;
        }).length;
        setOrdersToday(todayCount);

        const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
          const next = new Date(d); next.setDate(d.getDate() + 1);
          const count = list.filter((o) => {
            const od = o?.date ? new Date(o.date) : null;
            return od && od >= d && od < next;
          }).length;
          days.push({ day: dayNames[d.getDay()], orders: count });
        }
        setOrdersWeekly(days);
      } catch (err) {
        console.error("Failed to fetch orders", err);
        const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        const today = new Date(); today.setHours(0,0,0,0);
        const days = [];
        for (let i = 6; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate()-i); days.push({ day: dayNames[d.getDay()], orders: 0 }); }
        setOrdersWeekly(days);
        setOrdersTotal(0); setOrdersToday(0); setOrdersList([]);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  const norm = (s) => String(s ?? "").trim().toLowerCase();
  const paidUnprocessed = ordersList.filter((o) => {
    const p = norm(o.paymentStatus);
    const st = norm(o.status);
    return p === "succeeded" && (st === "" || st === "pending" || st === "paid");
  });

  const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
  const fmtDate  = (d) => (d ? new Date(d).toLocaleString() : "-");

  /* ---------- REAL finance: revenue stat + monthly chart ---------- */
  const [financeSeries, setFinanceSeries] = useState([
    // fallback look
    { month: "Apr", income: 24, expenses: 14 },
    { month: "May", income: 28, expenses: 18 },
    { month: "Jun", income: 32, expenses: 19 },
    { month: "Jul", income: 29, expenses: 21 },
    { month: "Aug", income: 35, expenses: 22 },
    { month: "Sep", income: 38, expenses: 25 },
  ]);
  const [revenue7d, setRevenue7d] = useState(0);

  useEffect(() => {
    const fetchFinanceReal = async () => {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: "Bearer " + token } : undefined;
      const backend = import.meta.env.VITE_BACKEND_URL;

      // helper dates
      const today = new Date();
      const endISO = today.toISOString().slice(0, 10);
      const start6m = new Date(today);
      start6m.setMonth(start6m.getMonth() - 5); // last 6 months window
      start6m.setDate(1); // from first day of the first month in window
      const startISO = start6m.toISOString().slice(0, 10);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenISO = sevenDaysAgo.toISOString().slice(0, 10);

      try {
        // fetch income and expenses within 6-month window
        const params6m = new URLSearchParams({ startDate: startISO, endDate: endISO }).toString();

        const [incomeRes, expenseRes, income7dRes] = await Promise.all([
          axios.get(`${backend}/api/income?${params6m}`, { headers }),
          axios.get(`${backend}/api/expenses?${params6m}`, { headers }),
          axios.get(`${backend}/api/income?${new URLSearchParams({ startDate: sevenISO, endDate: endISO }).toString()}`, { headers }),
        ]);

        const incomes = Array.isArray(incomeRes?.data?.incomes) ? incomeRes.data.incomes
                        : Array.isArray(incomeRes?.data) ? incomeRes.data : [];
        const expenses = Array.isArray(expenseRes?.data) ? expenseRes.data
                        : Array.isArray(expenseRes?.data?.expenses) ? expenseRes.data.expenses : [];

        // 7d revenue = sum of income amounts in last 7 days
        const incomes7 = Array.isArray(income7dRes?.data?.incomes) ? income7dRes.data.incomes
                         : Array.isArray(income7dRes?.data) ? income7dRes.data : [];
        const rev7 = incomes7.reduce((sum, x) => sum + Number(x.amount || 0), 0);
        setRevenue7d(rev7);

        // build last 6 months buckets
        const monthKeys = [];
        const monthFmt = (d) => d.toLocaleString(undefined, { month: "short" });
        const cursor = new Date(start6m);
        for (let i = 0; i < 6; i++) {
          monthKeys.push({ y: cursor.getFullYear(), m: cursor.getMonth(), label: monthFmt(cursor) });
          cursor.setMonth(cursor.getMonth() + 1);
        }

        const incMap = new Map();
        const expMap = new Map();
        for (const key of monthKeys) {
          incMap.set(`${key.y}-${key.m}`, 0);
          expMap.set(`${key.y}-${key.m}`, 0);
        }

        const bucket = (dt) => {
          const d = new Date(dt);
          return `${d.getFullYear()}-${d.getMonth()}`;
        };

        incomes.forEach((i) => {
          if (!i?.date) return;
          const k = bucket(i.date);
          if (incMap.has(k)) incMap.set(k, incMap.get(k) + Number(i.amount || 0));
        });
        expenses.forEach((e) => {
          if (!e?.date) return;
          const k = bucket(e.date);
          if (expMap.has(k)) expMap.set(k, expMap.get(k) + Number(e.amount || 0));
        });

        const series = monthKeys.map((k) => ({
          month: k.label,
          income: Number(incMap.get(`${k.y}-${k.m}`) || 0),
          expenses: Number(expMap.get(`${k.y}-${k.m}`) || 0),
        }));

        setFinanceSeries(series);
      } catch (err) {
        console.error("Finance fetch failed, using fallback", err);
        // keep fallback series & revenue7d as 0
      }
    };

    fetchFinanceReal();
    const interval = setInterval(fetchFinanceReal, 60000);
    return () => clearInterval(interval);
  }, []);

  // Stock / Reviews / Weather (data unchanged)
  const stockData = [
    { item: "Tuna", qty: 5240 },
    { item: "Salmon", qty: 3810 },
    { item: "Prawns", qty: 1560 },
    { item: "Crabs", qty: 980 },
    { item: "Sardines", qty: 4370 },
    { item: "Cod", qty: 2150 },
  ];

  const reviewsData = [
    { name: "5★", value: 56 },
    { name: "4★", value: 28 },
    { name: "3★", value: 10 },
    { name: "2★", value: 4 },
    { name: "1★", value: 2 },
  ];

  const COLORS = ["#0891b2", "#0ea5e9", "#818cf8", "#22c55e", "#f97316"];

  return (
    <div className="space-y-6">
      {/* Row 1: Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Customers" value={String(customerCount)} sub="total registered" change="" positive={true} icon={<UsersIcon className="h-5 w-5" />} darkMode={darkMode} />
        <StatCard title="Fishermen" value={String(fishermanCount)} sub="total registered" change="" positive={true} icon={<UsersIcon className="h-5 w-5" />} darkMode={darkMode} />
        <StatCard title="Orders" value={String(ordersTotal)} sub={`+${ordersToday} today`} change="" positive={true} icon={<FileCheck2 className="h-5 w-5" />} darkMode={darkMode} />
        <StatCard
          title="Revenue"
          value={`Rs.${Number(revenue7d).toLocaleString()}`}
          sub="last 7 days"
          change=""
          positive={true}
          icon={<CreditCard className="h-5 w-5" />}
          darkMode={darkMode}
        />
      </div>

      {/* Row 2: Main Analytics (Left: Orders + Income | Right: Paid Orders) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT (spans 2): Orders + Income */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Orders chart */}
          <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
            style={{ background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Orders</h3>
              <div className="flex items-center gap-2">
                <button className={`rounded-lg p-1.5 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><Calendar className="h-4 w-4" /></button>
                <button className={`rounded-lg p-1.5 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><Download className="h-4 w-4" /></button>
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
                  <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#000' }} />
                  <Area type="monotone" dataKey="orders" stroke="#06b6d4" fill="url(#orders)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income & Expenses (REAL) */}
          <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
            style={{ background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
            <h3 className="mb-4 text-base font-semibold">Income & Expenses</h3>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeSeries} margin={{ left: 6, right: 10, top: 10, bottom: 0 }}>
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
                  <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#000' }} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" fill="url(#inc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" fill="url(#exp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT (spans 1): Paid Orders (Unprocessed) */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
            style={{ background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Paid Orders (Unprocessed)</h3>
              <Link to="/admin/orders" className={darkMode ? "text-sky-300 hover:underline" : "text-sky-700 hover:underline"}>View all</Link>
            </div>
            {paidUnprocessed.length === 0 ? (
              <div className={darkMode ? "text-slate-400" : "text-slate-500"}>No paid orders awaiting processing.</div>
            ) : (
              <div className={`overflow-x-auto rounded-xl ring-1 ${darkMode ? "ring-slate-700" : "ring-slate-200"}`}>
                <table className="min-w-full text-sm">
                  <thead className={darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}>
                    <tr>
                      <th className="px-4 py-2 text-left">Order ID</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className={darkMode ? "divide-y divide-slate-700" : "divide-y divide-slate-200"}>
                    {paidUnprocessed.slice(0, 10).map((o) => (
                      <tr key={o._id} className={darkMode ? "hover:bg-slate-700/30" : "hover:bg-slate-50"}>
                        <td className="px-4 py-2 font-mono text-xs">{o.orderId}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium">{o.name || "-"}</div>
                          <div className="text-xs text-slate-500">{o.email || ""}</div>
                        </td>
                        <td className="px-4 py-2 font-semibold">{fmtMoney(o.total)}</td>
                        <td className="px-4 py-2 text-slate-500">{fmtDate(o.date)}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                            paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {paidUnprocessed.length > 10 && (
                  <div className={`px-4 py-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Showing first 10. See “View all” for more.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Operational Summaries (Stock, Reviews, Weather) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stock */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{ background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
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
                <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#000' }} />
                <Bar dataKey="qty" name="Quantity (kg)" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reviews */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{ background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
          <h3 className="mb-4 text-base font-semibold">Reviews</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reviewsData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{ fill: darkMode ? '#e2e8f0' : '#4b5563', fontSize: '12px' }}>
                  {reviewsData.map((e, i) => (<Cell key={`r-${i}`} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#000' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather */}
        <div className="rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:shadow-lg"
          style={{ background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Weather Forecast</h3>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Next 7 days (°C)</span>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { day: "Sat", temp: 30, rain: 10 },
                { day: "Sun", temp: 29, rain: 20 },
                { day: "Mon", temp: 31, rain: 5 },
                { day: "Tue", temp: 28, rain: 40 },
                { day: "Wed", temp: 27, rain: 60 },
                { day: "Thu", temp: 29, rain: 25 },
                { day: "Fri", temp: 30, rain: 15 },
              ]} margin={{ left: 6, right: 10, top: 10, bottom: 0 }}>
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
                <YAxis yAxisId="left" stroke={darkMode ? '#cbd5e1' : '#64748b'} tickFormatter={(v) => `${v}°`} />
                <YAxis yAxisId="right" orientation="right" stroke={darkMode ? '#cbd5e1' : '#64748b'} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#000' }}
                  formatter={(value, name) => name === 'temp' ? [`${value}°C`, 'Temp'] : [`${value}%`, 'Rain chance']} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="temp" name="Temp" stroke="#06b6d4" fill="url(#tempGrad)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="rain" name="Rain chance" stroke="#818cf8" fill="url(#rainGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, change, positive, icon, darkMode }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 shadow ring-1 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
      darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
    }`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-2 text-white shadow">{icon}</div>
        {change ? <span className={`text-xs font-medium ${positive ? 'text-green-500' : 'text-red-500'}`}>{change}</span> : <span />}
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
