import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Command Center", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { name: "Surveillance", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", path: "/monitor" },
  { name: "Incident Log", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", path: "/incidents" },
  { name: "Public Comms", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", path: "/status-pages" },
  { name: "Task Force", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", path: "/team" },
  { name: "Encryption", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", path: "/settings" },
];

// Shared app sidebar. The parent owns open/closed state so it can render a mobile hamburger.
const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_URL}/api/v1/users/profile`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } catch (error) {
        console.error("Failed to fetch user:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };
    if (localStorage.getItem("token")) fetchUser();
  }, [navigate]);

  // Auto-manage sidebar based on screen size
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Close sidebar on nav click (mobile only)
  const handleNavClick = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#111118]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col
          transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:transition-[width] lg:duration-500
          ${sidebarOpen ? "lg:w-72" : "lg:w-24"}
        `}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 transition-opacity duration-300 ${!sidebarOpen ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
              }`}
          >
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <div className="w-4 h-4 bg-black rounded-sm" />
            </div>
            <span className="text-xl font-black HeadingFont uppercase tracking-tighter">Watchtower</span>
          </Link>

          {/* Desktop toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all hidden lg:block"
          >
            <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </motion.div>
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-500 transition lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleNavClick}
                className={`group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative ${isActive
                    ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
              >
                <svg className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className={`text-xs font-black HeadingFont uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen ? "lg:opacity-0 lg:pointer-events-none" : "opacity-100"}`}>
                  {item.name}
                </span>
                {isActive && sidebarOpen && (
                  <motion.div layoutId="activeNav" className="absolute right-4 w-1.5 h-1.5 bg-black rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-6 border-t border-white/5 bg-[#0a0a0f]/40">
          <div className={`flex items-center gap-4 ${!sidebarOpen ? "lg:justify-center" : ""}`}>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 text-xl font-black HeadingFont shrink-0 shadow-inner">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className={`flex-1 min-w-0 transition-opacity duration-300 ${!sidebarOpen ? "lg:opacity-0 lg:w-0" : "opacity-100"}`}>
              <p className="text-sm font-black HeadingFont uppercase tracking-widest text-white truncate">{user?.name || "Operative"}</p>
              <p className="text-[10px] text-gray-500 font-mono tracking-tighter truncate uppercase">{user?.email || "Signal Lost"}</p>
            </div>
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-6 w-full py-3 text-[10px] font-black HeadingFont uppercase tracking-[0.2em] text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/20 transition-all"
            >
              Terminate Session
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
