import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Check if user is logged in and get user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Decode token to get user info (assuming JWT format)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email || "");
        setUserRole(payload.role || "");
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Smooth scroll to a section if it's present
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handlers for section nav (keep your existing code)
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

  // Fetch notifications based on user role and email
  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter notifications based on user role and email
        let filteredNotifications = [];
        
        if (userRole === "customer") {
          // Customers see broadcast notifications AND targeted notifications for their email
          filteredNotifications = data.notifications.filter(n => 
            n.role === "customer" && 
            (!n.targetEmails || n.targetEmails.length === 0 || n.targetEmails.includes(userEmail))
          );
        } else if (userRole === "admin") {
          // Admins see all customer notifications (for management purposes)
          filteredNotifications = data.notifications.filter(n => n.role === "customer");
        }
        // Fishermen don't see any notifications in this view
        
        setNotifications(filteredNotifications || []);
        setNotificationCount(filteredNotifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
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
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
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
          // Update local state for each successfully marked notification
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

  // Toggle notifications dropdown
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

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest(".notifications-container")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // Cart count logic (keep your existing code)
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

    const onStorage = (e) => { if (e.key === "cart") readCartCount(); };
    const onCartUpdated = () => readCartCount();
    const onVisible = () => { if (!document.hidden) readCartCount(); };

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

  return (
    <header className="h-[75px] w-full bg-white shadow-md flex items-center px-6 relative">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo-dashboard.png"
          alt="Ocean Track 360"
          className="h-10 w-auto"
        />
      </div>

      {/* Center: Navigation */}
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

      {/* Right: Notification bell, Cart + Auth buttons */}
      <div className="flex items-center gap-3">
        {/* Notification Bell - Only show for customers and admins */}
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

            {/* Notifications Dropdown */}
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
      </div>
    </header>
  );
}