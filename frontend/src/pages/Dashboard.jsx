import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(
    () => location.state?.message || ""
  );

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

  // Check auth and redirect if no token
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!location.state?.message) return;

    navigate(location.pathname, { replace: true, state: null });
    const dismissMessage = window.setTimeout(() => setSuccessMessage(""), 4000);
    return () => window.clearTimeout(dismissMessage);
  }, [location.pathname, location.state, navigate]);

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
        // Handle 403 (invalid/expired token) and 401 (unauthorized)
        if (error.response?.status === 403 || error.response?.status === 401) {
          console.warn("Token validation failed. Session expired or invalid. Redirecting to login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
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
        // Handle token auth failures
        if (error.response?.status === 403 || error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
      }
    };

    if (localStorage.getItem("token")) {
      fetchWebsites();
      fetchAllMetrics();
    } else {
      setLoading(false);
    }
  }, [navigate]);

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
      // Handle token auth failures
      if (error.response?.status === 403 || error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setAddError(error.response?.data?.message || "Failed to add monitor. Please try again.");
    } finally {
      setAddingMonitor(false);
    }
  };

  const handleDeleteWebsite = async (e, website) => {
    e.stopPropagation(); // Prevent bubbling to parent onClick
  
    if (!confirm(`Are you sure you want to delete "${website.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_URL}/api/v1/websites/delete-website/${website.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Remove from UI
      setWebsites((prev) => prev.filter((item) => item.id !== website.id));
      alert(`"${website.name}" has been deleted.`);
    } catch (error) {
      console.error("Failed to delete website:", error);
      // Handle token auth failures
      if (error.response?.status === 403 || error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      alert(error.response?.data?.message || "Failed to delete website. Please try again.");
    }
  };
    
    
   



  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-amber-500 HeadingFont uppercase tracking-widest text-xs animate-pulse">Establishing Connection...</p>
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const stats = [
    {
      title: "Active Monitors",
      value: (websites?.length || 0).toString(),
      change: "DEPLOYED",
      changeType: "positive",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Global Uptime",
      value: `${metrics.up.toFixed(1)}%`,
      change: metrics.up >= 95 ? "STABLE" : "UNSTABLE",
      changeType: metrics.up >= 95 ? "positive" : "negative",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: "Total Incidents",
      value: metrics.down.toString(),
      change: metrics.down === 0 ? "SECURE" : "BREACH DETECTED",
      changeType: metrics.down === 0 ? "positive" : "negative",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      title: "Signal Latency",
      value: `${Math.round(metrics.avgResponseTime)}ms`,
      change: metrics.avgResponseTime < 500 ? "OPTIMAL" : "LAG DETECTED",
      changeType: metrics.avgResponseTime < 500 ? "positive" : "negative",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const recentActivity = [
    { id: 1, type: "incident", message: "Auth Service link dropped", time: "5m ago", status: "critical" },
    { id: 2, type: "resolved", message: "API Sector-7 re-established", time: "1h ago", status: "success" },
    { id: 3, type: "monitor", message: "New node deployed: Edge-CDN", time: "3h ago", status: "info" },
    { id: 4, type: "alert", message: "High latency on Primary-DB", time: "5h ago", status: "warning" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-hidden flex relative font-['Inter']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
        .hex-grid {
          background-image: radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.05) 1px, transparent 0);
          background-size: 32px 32px;
        }
      `}</style>

      <div className="absolute inset-0 hex-grid pointer-events-none opacity-50" />

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-white/5 text-gray-500 transition lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-black HeadingFont uppercase tracking-[0.3em] text-gray-600">Secure Protocol v4.2</span>
              </div>
              <h2 className="text-xl font-black HeadingFont uppercase tracking-tight text-white truncate">Command Center</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative hidden md:block group">
              <input
                type="text"
                placeholder="Search nodes..."
                className="w-64 pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-xs font-medium HeadingFont uppercase tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:bg-white/[0.08] transition-all"
              />
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Add Monitor Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-black HeadingFont uppercase tracking-widest text-[10px] rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Enlist Monitor
            </motion.button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                role="status"
                className="flex items-center justify-between gap-4 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-semibold text-green-300"
              >
                <span>{successMessage}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage("")}
                  aria-label="Dismiss login confirmation"
                  className="text-green-300/80 transition-colors hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, borderColor: "rgba(245, 158, 11, 0.3)" }}
                className="bg-[#111118]/40 rounded-4xl border border-white/5 p-8 relative overflow-hidden group transition-all"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/5 transition-colors" />

                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 border border-white/5 transition-colors group-hover:border-amber-500/20 group-hover:bg-amber-500/5">
                    {stat.icon}
                  </div>
                  <span
                    className={`text-[10px] font-black HeadingFont uppercase tracking-widest py-1.5 px-3 rounded-xl border ${stat.changeType === "positive"
                        ? "text-green-500 border-green-500/10 bg-green-500/5"
                        : "text-red-500 border-red-500/10 bg-red-500/5"
                      }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-4xl font-black HeadingFont text-white mb-2 tracking-tighter">{stat.value}</h3>
                <p className="text-[10px] font-black HeadingFont uppercase tracking-[0.2em] text-gray-500">{stat.title}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Monitors Table */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="xl:col-span-2 bg-[#111118]/60 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col"
            >
              <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-sm font-black HeadingFont uppercase tracking-[0.3em] text-gray-400">Deployed Nodes</h3>
                  <p className="text-[10px] text-gray-600 font-mono mt-1 tracking-widest">Active Surveillance Registry</p>
                </div>
                <Link to="/monitor" className="text-[10px] font-black HeadingFont uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors border border-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-500/5">
                  Full Manifest
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-125 scrollbar-hide">
                {websites.length === 0 ? (
                  <div className="py-32 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-4xl flex items-center justify-center text-gray-700 mx-auto mb-6">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-black HeadingFont uppercase tracking-widest text-gray-600">No signals detected in this sector</p>
                    <button onClick={() => setShowAddModal(true)} className="mt-4 text-[10px] text-amber-500 font-bold uppercase tracking-widest">Initiate First Deployment</button>
                  </div>
                ) : (
                  websites.map((website, i) => (
                    <motion.div
                      key={website.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="px-10 py-6 flex items-center justify-between hover:bg-white/3 active:bg-white/5 transition-all group cursor-pointer"
                      onClick={() => navigate(`/monitor/${website.name}`)}
                    >
                      <div className="flex items-center gap-6 min-w-0 flex-1">
                        <div className="relative">
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black HeadingFont uppercase tracking-tight text-white text-base group-hover:text-amber-500 transition-colors">
                            {website.name}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono tracking-tighter truncate max-w-xs mt-1">
                            LOG: {website.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="hidden sm:block text-right">
                          <div className="text-[10px] font-black HeadingFont uppercase tracking-widest text-green-500">Node Secure</div>
                          <div className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase mt-0.5">Uptime: 100%</div>
                        </div>
                        <button
                          to={`/monitor/${website.name}`}
                          className="p-3 bg-white/5 hover:bg-amber-500 hover:text-black transition-all rounded-2xl group-hover:bg-amber-500 group-hover:text-black"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleDeleteWebsite(event, website)}
                          className="p-3 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all rounded-2xl border border-red-500/20 hover:border-red-500"
                          title="Delete website"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-[#111118]/60 rounded-[2.5rem] border border-white/5 flex flex-col"
            >
              <div className="px-8 py-8 border-b border-white/5 bg-white/2">
                <h3 className="text-sm font-black HeadingFont uppercase tracking-[0.3em] text-gray-400">Signal Intelligence</h3>
                <p className="text-[10px] text-gray-600 font-mono mt-1 tracking-widest">Real-time Stream</p>
              </div>
              <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
                {recentActivity.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex gap-4 p-4 rounded-2xl bg-white/2 border border-white/2 hover:border-white/5 transition-all"
                  >
                    <div className="mt-1">
                      <div className={`w-2 h-2 rounded-full shadow-lg ${activity.status === "critical" ? "bg-red-500 shadow-red-500/40" :
                          activity.status === "success" ? "bg-green-500 shadow-green-500/40" :
                            activity.status === "warning" ? "bg-amber-500 shadow-amber-500/40" : "bg-blue-500 shadow-blue-500/40"
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-200 HeadingFont uppercase tracking-tight mb-1">{activity.message}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 font-mono uppercase tracking-tighter">Event Time:</span>
                        <span className="text-[10px] text-amber-500/50 font-mono uppercase tracking-tighter">{activity.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-8 border-t border-white/5">
                <button className="w-full py-3 text-[10px] font-black HeadingFont uppercase tracking-widest text-gray-500 hover:text-white transition-colors text-center border border-white/5 rounded-2xl hover:bg-white/5">
                  Analyze Historical Data →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Add Monitor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-6 sm:p-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md"
              onClick={() => setShowAddModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-[#111118] border border-white/10 w-full sm:max-w-lg rounded-[2.5rem] p-10 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20" />
              <div className="absolute top-0 left-0 w-1/3 h-1 bg-amber-500" />

              {/* Close Button */}
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  <span className="text-[10px] font-black HeadingFont uppercase tracking-[0.4em] text-gray-500">Initiate Protocol</span>
                </div>
                <h3 className="text-3xl font-black HeadingFont uppercase tracking-tight text-white">Enlist Monitor</h3>
                <p className="text-sm text-gray-500 BodyFont mt-2">Deploy a new surveillance node to the specified endpoint.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleAddMonitor} className="space-y-6">
                {addError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black HeadingFont uppercase tracking-widest text-center"
                  >
                    DEPLOYMENT FAILED: {addError}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label htmlFor="monitorName" className="text-[10px] font-black HeadingFont uppercase tracking-[0.2em] text-gray-600 ml-1">
                    Designation
                  </label>
                  <input
                    id="monitorName"
                    type="text"
                    autoComplete="off"
                    value={newMonitor.name}
                    onChange={(e) => setNewMonitor((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold HeadingFont text-white placeholder-gray-700 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                    placeholder="E.G. PRIMARY-DATACENTER"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="monitorUrl" className="text-[10px] font-black HeadingFont uppercase tracking-[0.2em] text-gray-600 ml-1">
                    Target Endpoint (URL)
                  </label>
                  <input
                    id="monitorUrl"
                    type="url"
                    autoComplete="off"
                    value={newMonitor.url}
                    onChange={(e) => setNewMonitor((prev) => ({ ...prev, url: e.target.value }))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold HeadingFont text-white placeholder-gray-700 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                    placeholder="https://core-service.network"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 text-[10px] font-black HeadingFont uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                  >
                    Abort Deployment
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={addingMonitor}
                    className="flex-[1.5] py-4 bg-amber-500 text-black font-black HeadingFont uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {addingMonitor ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      "Execute Enlistment"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
