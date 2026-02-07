import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [websites, setWebsites] = useState([]); // Must be []
  const [loading, setLoading] = useState(true);
 

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ name: "", url: "" });
  const [addingMonitor, setAddingMonitor] = useState(false);
  const [addError, setAddError] = useState("");
  const [metrics ,setMetrics] = useState({
    totalChecks: 0,
    avgResponseTime: 0,
    down: 0,
    up:0
  })

  // Check auth and redirect if no token
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch user profile
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
        // If unauthorized, redirect to login
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

  // Fetch websites/monitors
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
        // Ensure we always set an array
        const data = response.data.websites || [];
        console.log("Fetched websites:", data);
        setWebsites(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch websites:", error);
        setWebsites([]); // Set empty array on error
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
        console.log("Fetched metrics:", response.data);
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

  // Handle Add Monitor
  const handleAddMonitor = async (e) => {
    e.preventDefault();
    setAddError("");

    // Validation
    if (!newMonitor.name.trim() || !newMonitor.url.trim()) {
      setAddError("Please fill in all fields");
      return;
    }

    setAddingMonitor(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_URL}/api/v1/websites/add-website`,
        {
          name: newMonitor.name,
          url: newMonitor.url,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
   
      // Safe spread - ensure prev is an array
      setWebsites((prev) => [...(Array.isArray(prev) ? prev : []), response.data.data]);

      // Reset form and close modal
      setNewMonitor({ name: "", url: "" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to add monitor:", error);
      setAddError(
        error.response?.data?.message || "Failed to add monitor. Please try again."
      );
    } finally {
      setAddingMonitor(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin h-10 w-10 border-4 border-[#319795] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Real stats data from API
  const stats = [
    {
      title: "Total Monitors",
      value: (websites?.length || 0).toString(),
      change: "",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // Mock recent activity
  const recentActivity = [
    { id: 1, type: "incident", message: "Auth Service went down", time: "5 min ago", status: "critical" },
    { id: 2, type: "resolved", message: "API Server incident resolved", time: "1 hour ago", status: "success" },
    { id: 3, type: "monitor", message: "New monitor added: CDN", time: "3 hours ago", status: "info" },
    { id: 4, type: "alert", message: "High response time on Web App", time: "5 hours ago", status: "warning" },
  ];

  const navItems = [
    { name: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", active: true },
    { name: "Monitors", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", active: false },
    { name: "Incidents", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", active: false },
    { name: "Status Pages", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", active: false },
    { name: "Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", active: false },
    { name: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", active: false },
  ];

  return (
    <div className="min-h-screen flex" style={{
      background: "linear-gradient(135deg, #F8FAFC 0%, #DBE6E1 50%, #E6FFFA 100%)",
    }}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-[#DBE6E1] transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#DBE6E1]">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-[#319795]">WatchTower</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#E6FFFA] text-[#64748B] hover:text-[#319795] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
             ( <a
              key={item.name}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                item.active
                  ? "bg-[#E6FFFA] text-[#319795]"
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#334155]"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </a>
              )
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#DBE6E1]">
          <div className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}>
            <div className="w-10 h-10 rounded-full bg-[#319795] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#334155] truncate">{user?.name || "User"}</p>
                <p className="text-xs text-[#94A3B8] truncate">{user?.email || ""}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full py-2 text-sm text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#DBE6E1] flex items-center justify-between px-6">
          <div>
            <h2 className="text-xl font-semibold text-[#1E293B]">Dashboard</h2>
            <p className="text-sm text-[#64748B]">Welcome back, {user?.name?.split(" ")[0] || "User"}!</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#DBE6E1] rounded-lg text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent transition"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-[#64748B] hover:text-[#319795] hover:bg-[#E6FFFA] rounded-lg transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Add Monitor Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#319795] hover:bg-[#2C7A7B] text-white font-medium rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Monitor
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#DBE6E1] p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-[#E6FFFA] rounded-lg text-[#319795]">
                    {stat.icon}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#1E293B]">{stat.value}</h3>
                <p className="text-sm text-[#64748B]">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monitors Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#DBE6E1] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DBE6E1] flex items-center justify-between">
                <h3 className="font-semibold text-[#1E293B]">Monitors</h3>
                <a href="#" className="text-sm text-[#319795] hover:text-[#2C7A7B] font-medium">
                  View All
                </a>
              </div>
              <div className="divide-y divide-[#DBE6E1]">
                {websites.map((website) => (
                  <div key={website.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F8FAFC] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-[#1E293B]">{website.name}</div>
                        <div className="text-sm text-[#64748B] truncate max-w-xs">{website.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600 font-medium">Online</span>
                      <button
                        onClick={() => navigate(`/monitor/${website.name}`)}
                        className="text-[#319795] hover:text-[#2C7A7B] text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-[#DBE6E1]">
              <div className="px-6 py-4 border-b border-[#DBE6E1]">
                <h3 className="font-semibold text-[#1E293B]">Recent Activity</h3>
              </div>
              <div className="p-4 space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
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
                      <p className="text-sm text-[#334155]">{activity.message}</p>
                      <p className="text-xs text-[#94A3B8]">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-[#DBE6E1]">
                <a href="#" className="text-sm text-[#319795] hover:text-[#2C7A7B] font-medium">
                  View All Activity →
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-6">
            <h3 className="font-semibold text-[#1E293B] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Add Monitor", icon: "M12 4v16m8-8H4" },
                { name: "Create Status Page", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                { name: "Invite Team Member", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                { name: "View Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              ].map((action) => (
                <button
                  key={action.name}
                  className="flex flex-col items-center gap-2 p-4 bg-[#F8FAFC] hover:bg-[#E6FFFA] border border-[#DBE6E1] rounded-lg text-[#64748B] hover:text-[#319795] transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                  <span className="text-sm font-medium">{action.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add Monitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 border border-[#DBE6E1]">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#334155] transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#1E293B]">Add New Monitor</h3>
              <p className="text-sm text-[#64748B] mt-1">
                Enter the details of the website you want to monitor
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAddMonitor} className="space-y-4">
              {/* Error Message */}
              {addError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {addError}
                </div>
              )}

              {/* Name Field */}
              <div>
                <label
                  htmlFor="monitorName"
                  className="block text-sm font-medium text-[#334155] mb-2"
                >
                  Monitor Name
                </label>
                <input
                  id="monitorName"
                  type="text"
                  value={newMonitor.name}
                  onChange={(e) =>
                    setNewMonitor((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white border border-[#DBE6E1] rounded-lg text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent transition"
                  placeholder="e.g., My Website"
                />
              </div>

              {/* URL Field */}
              <div>
                <label
                  htmlFor="monitorUrl"
                  className="block text-sm font-medium text-[#334155] mb-2"
                >
                  Website URL
                </label>
                <input
                  id="monitorUrl"
                  type="url"
                  value={newMonitor.url}
                  onChange={(e) =>
                    setNewMonitor((prev) => ({ ...prev, url: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white border border-[#DBE6E1] rounded-lg text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent transition"
                  placeholder="e.g., https://example.com"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-4 bg-[#F8FAFC] hover:bg-[#DBE6E1] text-[#64748B] font-medium rounded-lg border border-[#DBE6E1] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMonitor}
                  className="flex-1 py-3 px-4 bg-[#319795] hover:bg-[#2C7A7B] disabled:bg-[#319795]/50 text-white font-medium rounded-lg transition flex items-center justify-center"
                >
                  {addingMonitor ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
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