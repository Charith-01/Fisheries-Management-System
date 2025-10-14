import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { clearAllAuthData } from "../hook/useRoleAccess";

function base64UrlDecode(input) {
  try {
    const pad = "=".repeat((4 - (input.length % 4)) % 4);
    const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
    const str = atob(b64);
    const bytes = Uint8Array.from([...str].map((c) => c.charCodeAt(0)));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readAuthFromStorage() {
  const candidates = ["customer", "user", "auth", "auth_user"];
  for (const key of candidates) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        const u = obj.customer || obj.user || obj;
        if (u?.role === "customer" || u?.email) return u;
      }
    } catch {  }
  }

  const tokenKeyCandidates = ["token", "authToken", "access_token", "jwt"];
  for (const key of tokenKeyCandidates) {
    const t = localStorage.getItem(key);
    if (!t) continue;
    const parts = t.split(".");
    if (parts.length === 3) {
      const payload = base64UrlDecode(parts[1]);
      if (payload && (payload.role === "customer" || payload.email)) {
        return {
          email: payload.email,
          firstName: payload.firstName || payload.given_name || "",
          lastName: payload.lastName || payload.family_name || "",
          role: payload.role || "customer",
        };
      }
    }
  }

  return null;
}

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(() => readAuthFromStorage());
  const [menuOpen, setMenuOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuRef = useRef(null);



  const clearAllAuthData = () => {
  const keysToRemove = [
    "customer", "user", "auth", "auth_user", "token", "authToken",
    "access_token", "jwt", "refresh_token", "userRole", "lastLogin"
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear any cookies that might be set
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  // Dispatch storage event to sync across tabs
  window.dispatchEvent(new Event('storage'));
  
  console.log("All auth data cleared successfully");
};
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email || "");
        setUserRole(payload.role || "");
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);
  
  useEffect(() => {
    const loadNotifications = async () => {
      const token = localStorage.getItem("token");
      if (token && (userRole === "customer" || userRole === "admin")) {
        await fetchNotifications();
      }
    };

    loadNotifications();
  }, [userRole, userEmail]); // Reload when user role or email changes

  // Also load when page becomes visible or user navigates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = localStorage.getItem("token");
        if (token && (userRole === "customer" || userRole === "admin")) {
          fetchNotifications();
        }
      }
    };

    // Load notifications when route changes
    const handleRouteChange = () => {
      const token = localStorage.getItem("token");
      if (token && (userRole === "customer" || userRole === "admin")) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [userRole, userEmail]);

  // Add periodic refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token && (userRole === "customer" || userRole === "admin") && !document.hidden) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [userRole, userEmail]);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goHero = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      scrollToId("hero");
    } else {
      navigate("/#hero");
      setTimeout(() => scrollToId("hero"), 0);
    }
  };

  const goCategories = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("categories");
    } else {
      navigate("/#categories");
      setTimeout(() => scrollToId("categories"), 0);
    }
  };

  const goTrending = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("trending");
    } else {
      navigate("/#trending");
      setTimeout(() => scrollToId("trending"), 0);
    }
  };

  const goContact = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("contact");
    } else {
      navigate("/#contact");
      setTimeout(() => scrollToId("contact"), 0);
    }
  };

  const goReviews = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("reviews");
    } else {
      navigate("/#reviews");
      setTimeout(() => scrollToId("reviews"), 0);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        let filteredNotifications = [];
        
        if (userRole === "customer") {
          filteredNotifications = data.notifications.filter(n => 
            n.role === "customer" && 
            (!n.targetEmails || n.targetEmails.length === 0 || 
             (userEmail && n.targetEmails.includes(userEmail.toLowerCase())))
          );
        } else if (userRole === "admin") {
          filteredNotifications = data.notifications.filter(n => n.role === "customer");
        }
        
        setNotifications(filteredNotifications || []);
        
        const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
        setNotificationCount(unreadCount);
      } else {
        console.error("Failed to fetch notifications:", response.status);
        setNotifications([]);
        setNotificationCount(0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setNotificationCount(prev => Math.max(0, prev - 1));
        
        // Refetch to ensure consistency
        setTimeout(() => fetchNotifications(), 100);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${notification._id}/read`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (response.ok) {
          setNotifications(prev => 
            prev.map(n => 
              n._id === notification._id ? { ...n, isRead: true } : n
            )
          );
        }
      }
      
      setNotificationCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const toggleNotifications = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest(".notifications-container")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    const readCartCount = () => {
      try {
        const raw = localStorage.getItem("cart") || "[]";
        const cart = JSON.parse(raw);
        const total = Array.isArray(cart)
          ? cart.filter((it) => (Number(it?.quantity) || 0) > 0).length
          : 0;
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };
    readCartCount();

    const readAuth = () => setUser(readAuthFromStorage());

    const onStorage = (e) => {
      if (e.key === "cart") readCartCount();
      if (!e.key || ["auth", "customer", "user", "token", "authToken", "jwt"].includes(e.key)) {
        readAuth();
      }
    };
    const onCartUpdated = () => readCartCount();
    const onVisible = () => {
      if (!document.hidden) {
        readCartCount();
        readAuth();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:updated", onCartUpdated);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:updated", onCartUpdated);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const initials = useMemo(() => {
    const f = (user?.firstName || "").trim();
    const l = (user?.lastName || "").trim();
    if (f || l) return `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();
    if (user?.email) return user.email[0]?.toUpperCase() || "U";
    return "U";
  }, [user]);

  // FIXED: Only keep one logout function that uses clearAllAuthData
  const logout = () => {
    setConfirmOpen(true);
  };

  const performLogout = () => {
    clearAllAuthData(); // Use the centralized function
    setUser(null);
    setMenuOpen(false);
    setConfirmOpen(false);
    setToast({ show: true, msg: "Logged out successfully" });
    navigate("/login"); // Navigate to login instead of home
    setTimeout(() => setToast({ show: false, msg: "" }), 2200);
  };

  return (
    <header className="h-[75px] w-full bg-white shadow-md flex items-center px-6">
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(6px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      <div className="flex items-center gap-3">
        <img
          src="/logo-dashboard.png"
          alt="Ocean Track 360"
          className="h-10 w-auto"
        />
      </div>

      <nav className="flex-1 flex justify-center">
        <ul className="flex items-center gap-8 text-blue-800 font-medium">
          <li>
            <a href="/#hero" onClick={goHero} className="hover:text-blue-600 transition">
              Home
            </a>
          </li>

          <li>
            <a href="/#categories" onClick={goCategories} className="hover:text-blue-600 transition">
              Category
            </a>
          </li>

          <li>
            <a href="/#trending" onClick={goTrending} className="hover:text-blue-600 transition">
              Trending
            </a>
          </li>

          <li>
            <a href="/#contact" onClick={goContact} className="hover:text-blue-600 transition">
              Contact
            </a>
          </li>

          <li>
            <a href="/#reviews" onClick={goReviews} className="hover:text-blue-600 transition">
              Reviews
            </a>
          </li>
        </ul>
      </nav>

      <div className="flex items-center gap-3">
        {(userRole === "customer" || userRole === "admin") && (
          <div className="notifications-container relative">
            <button
              onClick={toggleNotifications}
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg ring-1 ring-blue-200 text-blue-800 hover:bg-blue-50 hover:ring-blue-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ""}`}
              title="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {notificationCount > 0 && (
                <span
                  aria-live="polite"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 text-[10px] leading-[18px] text-white bg-red-600 rounded-full text-center font-bold shadow"
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {notificationCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.isRead ? "bg-blue-50" : ""
                        }`}
                        onClick={() => markAsRead(notification._id)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                        {notification.targetEmails && notification.targetEmails.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Personal notification for you
                          </div>
                        )}
                        {(!notification.targetEmails || notification.targetEmails.length === 0) && (
                          <div className="text-xs text-gray-500 mt-1">
                            Broadcast notification
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Link
          to="/cart"
          className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg ring-1 ring-blue-200 text-blue-800 hover:bg-blue-50 hover:ring-blue-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
          title="Cart"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M3 3h2l.4 2M7 13h10l3-8H6.4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="19" r="1.6" />
            <circle cx="17" cy="19" r="1.6" />
          </svg>

          {cartCount > 0 && (
            <span
              aria-live="polite"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 text-[10px] leading-[18px] text-white bg-red-600 rounded-full text-center font-bold shadow"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        {!user ? (
          <>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-blue-800 border border-blue-800 rounded-lg hover:bg-blue-50 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-700 transition"
            >
              Register
            </Link>
          </>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="h-10 px-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 text-blue-800 hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.email || "Profile"}
            >
              <div className="h-7 w-7 rounded-full bg-blue-800 text-white grid place-items-center font-bold ring-2 ring-blue-300/60">
                {initials}
              </div>
              <span className="hidden sm:inline text-sm font-semibold">
                {user?.firstName ? `Hi, ${user.firstName}` : "Account"}
              </span>
              <svg
                className={`h-4 w-4 transition ${menuOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden z-50"
                style={{ animation: "fadeInScale 160ms ease-out both" }}
              >
                <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-teal-50">
                  <p className="text-sm font-semibold text-slate-800">
                    {user?.firstName || user?.email || "Customer"}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  )}
                </div>

                <ul className="py-1">
                  <li>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-slate-500">
                        <path d="M3 6h18l-2 12H5L3 6Zm4 0V4h10v2H7Z" />
                      </svg>
                      My Orders
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-slate-500">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                      </svg>
                      Profile
                    </Link>
                  </li>
                  <li className="border-t mt-1">
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      role="menuitem"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-red-600">
                        <path d="M15 12H3v-2h12V7l6 5-6 5v-3Z" />
                      </svg>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-slate-900/40"
            style={{ animation: "overlayIn 160ms ease-out both" }}
            onClick={() => setConfirmOpen(false)}
          />
          <div
            className="relative z-[101] w-[90%] max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-5"
            style={{ animation: "modalIn 160ms ease-out both" }}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 grid place-items-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 14h-2v-2h2v2Zm0-4h-2V7h2v5Z"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">Are you sure you want to logout?</h3>
                <p className="mt-1 text-sm text-slate-600">You'll be returned to the login page and will need to log in again to access your account.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={performLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          className="fixed bottom-4 right-4 z-[101] rounded-xl px-4 py-3 shadow-xl bg-emerald-600 text-white text-sm flex items-center gap-2"
          style={{ animation: "toastIn 160ms ease-out both" }}
          role="status"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-1.1-6.2 6.4-6.4-1.4-1.4-5 5-2.3-2.3-1.4 1.4 3.7 3.7Z"/>
          </svg>
          <span>{toast.msg}</span>
          <button className="ml-2/ -mr-1 opacity-90 hover:opacity-100" onClick={() => setToast({ show: false, msg: "" })}>✕</button>
        </div>
      )}
    </header>
  );
}