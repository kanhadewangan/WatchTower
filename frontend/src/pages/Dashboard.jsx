import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ name: "", url: "" });
  const [addingMonitor, setAddingMonitor] = useState(false);
  const [addError, setAddError] = useState("");
  const [metrics, setMetrics] = useState({
    totalChecks: 0,
    avgResponseTime: 0,
    down: 0,
    up: 0
  });

  // Auto-manage sidebar based on screen size
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check auth and redirect if no token
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_URL}/api/v1/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
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

    if (localStorage.getItem("token")) {
      fetchUser();
    }
  }, [navigate]);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_URL}/api/v1/websites/websites`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = response.data.websites || [];
        setWebsites(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch websites:", error);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllMetrics = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_URL}/api/v1/checks/all-metrics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMetrics({
          totalChecks: response.data.totalChecks || 0,
          avgResponseTime: response.data.avgResponseTime || 0,
          down: response.data.down || 0,
          up: response.data.up || 0
        });
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }
    };

    if (localStorage.getItem("token")) {
      fetchWebsites();
      fetchAllMetrics();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAddMonitor = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!newMonitor.name.trim() || !newMonitor.url.trim()) {
      setAddError("Please fill in all fields");
      return;
    }
    setAddingMonitor(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_URL}/api/v1/websites/add-website`,
        { name: newMonitor.name, url: newMonitor.url },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setWebsites((prev) => [...(Array.isArray(prev) ? prev : []), response.data.data]);
      setNewMonitor({ name: "", url: "" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to add monitor:", error);
      setAddError(error.response?.data?.message || "Failed to add monitor. Please try again.");
    } finally {
      setAddingMonitor(false);
    }
  };

  // Close sidebar on nav click (mobile only)
  const handleNavClick = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin h-10 w-10 border-4 border-[#319795] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Monitors",
      value: (websites?.length || 0).toString(),
      change: "",
      changeType: "positive",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Uptime",
      value: `${metrics.up.toFixed(1)}%`,
      change: metrics.up >= 99 ? "Excellent" : metrics.up >= 95 ? "Good" : "Needs attention",
      changeType: metrics.up >= 95 ? "positive" : "negative",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: "Incidents",
      value: metrics.down.toString(),
      change: metrics.down === 0 ? "No incidents" : `${metrics.down} down`,
      changeType: metrics.down === 0 ? "positive" : "negative",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      title: "Response Time",
      value: `${Math.round(metrics.avgResponseTime)}ms`,
      change: metrics.avgResponseTime < 200 ? "Fast" : metrics.avgResponseTime < 500 ? "Normal" : "Slow",
      changeType: metrics.avgResponseTime < 500 ? "positive" : "negative",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const recentActivity = [
    { id: 1, type: "incident", message: "Auth Service went down", time: "5 min ago", status: "critical" },
    { id: 2, type: "resolved", message: "API Server incident resolved", time: "1 hour ago", status: "success" },
    { id: 3, type: "monitor", message: "New monitor added: CDN", time: "3 hours ago", status: "info" },
    { id: 4, type: "alert", message: "High response time on Web App", time: "5 hours ago", status: "warning" },
  ];

  const navItems = [
    { name: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
    { name: "Monitors", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", path: "/monitor" },
    { name: "Incidents", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", path: "/incidents" },
    { name: "Status Pages", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", path: "/status-pages" },
    { name: "Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", path: "/team" },
    { name: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", path: "/settings" },
  ];

  return (
    <div
      className="min-h-screen flex relative"
      style={{
        background: "linear-gradient(135deg, #F8FAFC 0%, #DBE6E1 50%, #E6FFFA 100%)",
      }}
    >
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#DBE6E1] flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:transition-[width] lg:duration-300
          ${sidebarOpen ? "lg:w-64" : "lg:w-20"}
        `}
      >
        {/* Logo */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 border-b border-[#DBE6E1]">
          <Link
            to="/dashboard"
            className={`text-xl font-bold text-[#319795] transition-opacity ${
              !sidebarOpen ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : ""
            }`}
          >
            WatchTower
          </Link>
          {/* Desktop toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#E6FFFA] text-[#64748B] hover:text-[#319795] transition hidden lg:block"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-[#E6FFFA] text-[#64748B] hover:text-[#319795] transition lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive
                    ? "bg-[#E6FFFA] text-[#319795]"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#334155]"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className={`font-medium whitespace-nowrap ${!sidebarOpen ? "lg:hidden" : ""}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#DBE6E1]">
          <div className={`flex items-center gap-3 ${!sidebarOpen ? "lg:justify-center" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-[#319795] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className={`flex-1 min-w-0 ${!sidebarOpen ? "lg:hidden" : ""}`}>
              <p className="text-sm font-medium text-[#334155] truncate">{user?.name || "User"}</p>
              <p className="text-xs text-[#94A3B8] truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full py-2 text-sm text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition ${
              !sidebarOpen ? "lg:hidden" : ""
            }`}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-[#DBE6E1] flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-[#E6FFFA] text-[#64748B] hover:text-[#319795] transition lg:hidden flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-semibold text-[#1E293B] truncate">Dashboard</h2>
              <p className="text-xs sm:text-sm text-[#64748B] hidden sm:block">
                Welcome back, {user?.name?.split(" ")[0] || "User"}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Search — hidden on small screens */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                className="w-40 lg:w-64 pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#DBE6E1] rounded-lg text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent transition text-sm"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-[#64748B] hover:text-[#319795] hover:bg-[#E6FFFA] rounded-lg transition">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Add Monitor Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 bg-[#319795] hover:bg-[#2C7A7B] text-white font-medium rounded-lg transition text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Monitor</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#DBE6E1] p-3 sm:p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-[#E6FFFA] rounded-lg text-[#319795]">
                    {stat.icon}
                  </div>
                  <span
                    className={`text-[10px] sm:text-sm font-medium ${
                      stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-[#1E293B]">{stat.value}</h3>
                <p className="text-xs sm:text-sm text-[#64748B]">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Monitors Table */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-[#DBE6E1] overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#DBE6E1] flex items-center justify-between">
                <h3 className="font-semibold text-[#1E293B] text-sm sm:text-base">Monitors</h3>
                <Link to="/monitor" className="text-xs sm:text-sm text-[#319795] hover:text-[#2C7A7B] font-medium">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-[#DBE6E1] max-h-72 sm:max-h-96 overflow-y-auto">
                {websites.length === 0 ? (
                  <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-[#64748B]">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-[#DBE6E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No monitors yet. Add your first one!</p>
                  </div>
                ) : (
                  websites.map((website) => (
                    <div
                      key={website.id}
                      className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-[#F8FAFC] transition gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#1E293B] text-sm sm:text-base truncate">
                            {website.name}
                          </div>
                          <div className="text-xs sm:text-sm text-[#64748B] truncate max-w-[120px] sm:max-w-xs">
                            {website.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-green-600 font-medium hidden xs:inline">
                          Online
                        </span>
                        <button
                          onClick={() => navigate(`/monitor/${website.name}`)}
                          className="text-[#319795] hover:text-[#2C7A7B] text-xs sm:text-sm font-medium whitespace-nowrap"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-[#DBE6E1]">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#DBE6E1]">
                <h3 className="font-semibold text-[#1E293B] text-sm sm:text-base">Recent Activity</h3>
              </div>
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-64 sm:max-h-none overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                    <div
                      className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.status === "critical"
                          ? "bg-red-500"
                          : activity.status === "success"
                          ? "bg-green-500"
                          : activity.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-[#334155]">{activity.message}</p>
                      <p className="text-[10px] sm:text-xs text-[#94A3B8]">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-[#DBE6E1]">
                <a href="#" className="text-xs sm:text-sm text-[#319795] hover:text-[#2C7A7B] font-medium">
                  View All Activity →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Monitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          ></div>

          {/* Modal — slides up on mobile, centered on desktop */}
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 p-4 sm:p-6 border border-[#DBE6E1] max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#94A3B8] hover:text-[#334155] transition"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Drag handle for mobile */}
            <div className="w-10 h-1 bg-[#DBE6E1] rounded-full mx-auto mb-4 sm:hidden"></div>

            {/* Modal Header */}
            <div className="mb-4 sm:mb-6 pr-8">
              <h3 className="text-lg sm:text-xl font-semibold text-[#1E293B]">Add New Monitor</h3>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Enter the details of the website you want to monitor
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAddMonitor} className="space-y-3 sm:space-y-4">
              {addError && (
                <div className="p-2 sm:p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xs sm:text-sm">
                  {addError}
                </div>
              )}

              <div>
                <label htmlFor="monitorName" className="block text-xs sm:text-sm font-medium text-[#334155] mb-1.5">
                  Monitor Name
                </label>
                <input
                  id="monitorName"
                  type="text"
                  value={newMonitor.name}
                  onChange={(e) => setNewMonitor((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-[#DBE6E1] rounded-lg text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent transition text-sm"
                  placeholder="e.g., My Website"
                />
              </div>

              <div>
                <label htmlFor="monitorUrl" className="block text-xs sm:text-sm font-medium text-[#334155] mb-1.5">
                  Website URL
                </label>
                <input
                  id="monitorUrl"
                  type="url"
                  value={newMonitor.url}
                  onChange={(e) => setNewMonitor((prev) => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-[#DBE6E1] rounded-lg text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent transition text-sm"
                  placeholder="e.g., https://example.com"
                />
              </div>

              <div className="flex gap-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 sm:py-3 px-4 bg-[#F8FAFC] hover:bg-[#DBE6E1] text-[#64748B] font-medium rounded-lg border border-[#DBE6E1] transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMonitor}
                  className="flex-1 py-2.5 sm:py-3 px-4 bg-[#319795] hover:bg-[#2C7A7B] disabled:bg-[#319795]/50 text-white font-medium rounded-lg transition flex items-center justify-center text-sm"
                >
                  {addingMonitor ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    "Add Monitor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;