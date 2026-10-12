import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const INTERVAL_OPTIONS = [
  { value: 30, label: "Every 30 seconds" },
  { value: 60, label: "Every minute" },
  { value: 300, label: "Every 5 minutes" },
  { value: 600, label: "Every 10 minutes" },
  { value: 1800, label: "Every 30 minutes" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [siteMetrics, setSiteMetrics] = useState({});
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [successMessage, setSuccessMessage] = useState(
    () => location.state?.message || ""
  );

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ name: "", url: "", checkInterval: 60 });
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

  const fetchSiteMetrics = async (list) => {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    const entries = await Promise.all(
      list.map(async (site) => {
        const [uptimeRes, latestRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_URL}/api/v1/checks/uptime/${site.name}`, { headers }).catch(() => null),
          axios.get(`${import.meta.env.VITE_URL}/api/v1/checks/latest-check/${site.name}`, { headers }).catch(() => null),
        ]);
        const latest = latestRes?.data?.latestCheck || null;
        return [
          site.id,
          {
            status: latest?.status || "UNKNOWN",
            statusCode: latest?.status_code ?? null,
            uptime: uptimeRes?.data?.uptimePercentage ?? null,
            responseTime: uptimeRes?.data?.averageResponseTime ?? null,
            checkedAt: latest?.created_at || null,
          },
        ];
      })
    );
    setSiteMetrics(Object.fromEntries(entries));
    setRefreshedAt(new Date());
  };

  // Keep results fresh so stale monitors show up without a manual reload
  const websitesRef = useRef(websites);
  websitesRef.current = websites;
  useEffect(() => {
    const id = window.setInterval(() => {
      if (websitesRef.current.length) fetchSiteMetrics(websitesRef.current);
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

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
        fetchSiteMetrics(Array.isArray(data) ? data : []);
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
        { name: newMonitor.name, url: newMonitor.url, checkInterval: newMonitor.checkInterval },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setWebsites((prev) => [...(Array.isArray(prev) ? prev : []), response.data.data]);
      setSiteMetrics((prev) => ({ ...prev, [response.data.data.id]: { status: "UNKNOWN", uptime: null, responseTime: null, checkedAt: null } }));
      setNewMonitor({ name: "", url: "", checkInterval: 60 });
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

  const handleIntervalChange = async (website, checkInterval) => {
    const previous = website.checkInterval;
    setWebsites((prev) => prev.map((w) => (w.id === website.id ? { ...w, checkInterval } : w)));
    try {
      await axios.patch(
        `${import.meta.env.VITE_URL}/api/v1/websites/check-interval/${website.id}`,
        { checkInterval },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
    } catch (error) {
      console.error("Failed to update interval:", error);
      setWebsites((prev) => prev.map((w) => (w.id === website.id ? { ...w, checkInterval: previous } : w)));
      alert(error.response?.data?.message || "Failed to update check interval.");
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

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const firstName = user?.name?.split(" ")[0];

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 BodyFont text-sm">Loading your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  const totalChecks = metrics.totalChecks || metrics.up + metrics.down;
  const uptimePct = totalChecks > 0 ? (metrics.up / totalChecks) * 100 : null;

  // A monitor is stale when its last check is older than a few of its own intervals (minimum 3 minutes)
  const staleAfterMs = (site) => Math.max(3 * 60, 3 * (site.checkInterval || 60)) * 1000;
  const BLOCK_CODES = [401, 403, 429];
  const statusOf = (site) => {
    const m = siteMetrics[site.id];
    if (!m || m.status === "UNKNOWN") return "UNKNOWN";
    if (Date.now() - new Date(m.checkedAt).getTime() > staleAfterMs(site)) return "STALE";
    if (m.status === "DOWN" && BLOCK_CODES.includes(m.statusCode)) return "BLOCKED";
    return m.status;
  };
  const sitesIn = (state) => websites.filter((w) => statusOf(w) === state);
  const downSites = sitesIn("DOWN");
  const blockedSites = sitesIn("BLOCKED");
  const staleSites = sitesIn("STALE");
  const allUp = websites.length > 0 && websites.every((w) => statusOf(w) === "UP");
  const hasIssues = downSites.length + blockedSites.length + staleSites.length > 0;

  const query = search.trim().toLowerCase();
  const filtered = websites.filter(
    (w) => !query || w.name?.toLowerCase().includes(query) || w.url?.toLowerCase().includes(query)
  );

  const timeAgo = (iso) => {
    if (!iso) return "Not checked yet";
    const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (secs < 60) return "Just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const STATUS_STYLE = {
    UP: { label: "Up", dot: "bg-green-500", pill: "text-green-400 bg-green-500/10 border-green-500/20" },
    DOWN: { label: "Down", dot: "bg-red-500", pill: "text-red-400 bg-red-500/10 border-red-500/20" },
    BLOCKED: { label: "Blocked", dot: "bg-orange-500", pill: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
    STALE: { label: "Stale", dot: "bg-amber-500", pill: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    UNKNOWN: { label: "Pending", dot: "bg-gray-500", pill: "text-gray-400 bg-white/5 border-white/10" },
  };

  const stats = [
    {
      title: "Monitors",
      value: websites.length.toString(),
      hint: websites.length === 1 ? "site being watched" : "sites being watched",
      icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
    {
      title: "Uptime",
      value: uptimePct === null ? "—" : `${uptimePct.toFixed(uptimePct === 100 ? 0 : 1)}%`,
      hint: uptimePct === null ? "no checks yet" : `across ${totalChecks.toLocaleString()} checks`,
      tone: uptimePct === null ? "" : uptimePct >= 95 ? "good" : "bad",
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    },
    {
      title: "Failed checks",
      value: metrics.down.toLocaleString(),
      hint: metrics.down === 0 ? "nothing has failed" : "checks that failed",
      tone: totalChecks === 0 ? "" : metrics.down === 0 ? "good" : "bad",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    },
    {
      title: "Avg response",
      value: totalChecks === 0 ? "—" : `${Math.round(metrics.avgResponseTime)} ms`,
      hint: totalChecks === 0 ? "no checks yet" : "across all checks",
      tone: totalChecks === 0 ? "" : metrics.avgResponseTime < 500 ? "good" : "bad",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  const toneClass = { good: "text-green-400", bad: "text-red-400", "": "text-white" };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-hidden flex relative font-['Inter']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
        .dash-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 50% at 60% 0%, #000 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 70% 50% at 60% 0%, #000 30%, transparent 80%);
        }
        a:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; }
      `}</style>

      <div className="absolute inset-0 dash-grid pointer-events-none" />
      <div className="absolute -top-40 right-0 w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-20 shrink-0 bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/5 flex items-center justify-between gap-4 px-5 sm:px-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded-xl hover:bg-white/5 text-gray-400 transition lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold HeadingFont tracking-tight truncate">
                {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
              </h2>
              <p className="text-xs text-gray-500 BodyFont truncate">
                {refreshedAt ? `Updated ${refreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Overview of your monitors"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monitors"
                aria-label="Search monitors"
                className="w-60 pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors BodyFont"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(245, 158, 11, 0.35)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-amber-500 text-black font-bold HeadingFont text-sm rounded-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add monitor</span>
            </motion.button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8 sm:space-y-10">
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                role="status"
                className="flex items-center justify-between gap-4 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-medium text-green-300"
              >
                <span>{successMessage}</span>
                <button type="button" onClick={() => setSuccessMessage("")} aria-label="Dismiss" className="text-green-300/80 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status banner */}
          {websites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-5 rounded-2xl border px-6 py-5 ${
                downSites.length > 0
                  ? "border-red-500/25 bg-red-500/10"
                  : hasIssues
                    ? "border-amber-500/25 bg-amber-500/10"
                    : allUp
                      ? "border-green-500/20 bg-green-500/[0.07]"
                      : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <span className="relative flex h-3 w-3 shrink-0">
                {downSites.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />}
                <span className={`relative inline-flex h-3 w-3 rounded-full ${downSites.length > 0 ? "bg-red-500" : hasIssues ? "bg-amber-500" : allUp ? "bg-green-500" : "bg-gray-500"}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold HeadingFont">
                  {downSites.length > 0
                    ? `${downSites.length} ${downSites.length === 1 ? "site is" : "sites are"} down`
                    : hasIssues
                      ? "Some monitors need attention"
                      : allUp
                        ? "All sites are up"
                        : "Waiting for the first checks"}
                </p>
                <p className="text-sm text-gray-400 BodyFont">
                  {hasIssues
                    ? [
                        downSites.length > 0 && `Down: ${downSites.map((s) => s.name).join(", ")}`,
                        blockedSites.length > 0 && `Blocked (site refuses monitor requests): ${blockedSites.map((s) => s.name).join(", ")}`,
                        staleSites.length > 0 && `Not checked recently: ${staleSites.map((s) => s.name).join(", ")}`,
                      ].filter(Boolean).join(" · ")
                    : allUp
                      ? "Every monitor passed its latest check."
                      : "Results show up here once checks have run."}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold HeadingFont shrink-0">
                <span className="px-2.5 py-1 rounded-full border text-green-400 bg-green-500/10 border-green-500/20">{sitesIn("UP").length} up</span>
                {downSites.length > 0 && <span className="px-2.5 py-1 rounded-full border text-red-400 bg-red-500/10 border-red-500/20">{downSites.length} down</span>}
                {blockedSites.length > 0 && <span className="px-2.5 py-1 rounded-full border text-orange-400 bg-orange-500/10 border-orange-500/20">{blockedSites.length} blocked</span>}
                {staleSites.length > 0 && <span className="px-2.5 py-1 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/20">{staleSites.length} stale</span>}
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {stats.map((stat) => (
              <motion.div
                key={stat.title}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-7"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-400 BodyFont">{stat.title}</span>
                  <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </span>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold HeadingFont tracking-tight ${toneClass[stat.tone || ""]}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 BodyFont mt-1.5">{stat.hint}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Monitors */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-white/10 bg-[#111118]/70 overflow-hidden"
          >
            <div className="px-6 sm:px-10 py-6 border-b border-white/5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold HeadingFont">Your monitors</h3>
                <p className="text-xs text-gray-500 BodyFont mt-0.5">
                  {query ? `${filtered.length} of ${websites.length} shown` : `${websites.length} total`}
                </p>
              </div>
              <Link to="/monitor" className="text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors HeadingFont">
                View all →
              </Link>
            </div>

            {websites.length === 0 ? (
              <div className="py-20 px-6 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold HeadingFont mb-2">Add your first monitor</h4>
                <p className="text-gray-400 BodyFont max-w-sm mx-auto mb-6">Paste a website URL and Watchtower will start checking it right away.</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl HeadingFont"
                >
                  Add monitor
                </motion.button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-gray-500 BodyFont">No monitors match “{search}”.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {filtered.map((website, i) => {
                  const m = siteMetrics[website.id];
                  const st = STATUS_STYLE[statusOf(website)];
                  return (
                    <motion.li
                      key={website.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                    >
                      <div
                        role="link"
                        tabIndex={0}
                        onClick={() => navigate(`/monitor/${encodeURIComponent(website.name)}`)}
                        onKeyDown={(e) => e.key === "Enter" && navigate(`/monitor/${encodeURIComponent(website.name)}`)}
                        className="group px-6 sm:px-10 py-6 flex items-center gap-5 sm:gap-8 hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold HeadingFont truncate group-hover:text-amber-500 transition-colors">{website.name}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">{website.url}</p>
                          {statusOf(website) === "BLOCKED" && (
                            <p className="text-xs text-orange-400/90 BodyFont mt-1">Returned {m.statusCode}. The site is likely blocking monitoring requests, not down.</p>
                          )}
                          {statusOf(website) === "DOWN" && m?.statusCode != null && (
                            <p className="text-xs text-red-400/90 BodyFont mt-1">{m.statusCode === 0 ? "No response from the site" : `Returned HTTP ${m.statusCode}`}</p>
                          )}
                          {statusOf(website) === "STALE" && (
                            <p className="text-xs text-amber-400/90 BodyFont mt-1">No check in {timeAgo(m.checkedAt).replace(" ago", "")}. Monitoring may have stopped.</p>
                          )}
                        </div>

                        <div className="hidden md:block w-24 text-right">
                          <p className="text-sm font-semibold HeadingFont">{m?.uptime != null && m.checkedAt ? `${m.uptime.toFixed(1)}%` : "—"}</p>
                          <p className="text-[11px] text-gray-500 BodyFont">uptime</p>
                        </div>
                        <div className="hidden md:block w-24 text-right">
                          <p className="text-sm font-semibold HeadingFont">{m?.responseTime != null && m.checkedAt ? `${Math.round(m.responseTime)} ms` : "—"}</p>
                          <p className="text-[11px] text-gray-500 BodyFont">avg response</p>
                        </div>
                        <select
                          value={website.checkInterval || 60}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          onChange={(e) => handleIntervalChange(website, Number(e.target.value))}
                          aria-label={`Check interval for ${website.name}`}
                          className="hidden xl:block bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 BodyFont"
                        >
                          {INTERVAL_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value} className="bg-[#111118]">{o.label}</option>
                          ))}
                        </select>
                        <div className="hidden lg:block w-28 text-right">
                          <p className="text-sm text-gray-300 BodyFont">{timeAgo(m?.checkedAt)}</p>
                          <p className="text-[11px] text-gray-500 BodyFont">last check</p>
                        </div>

                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${st.pill}`}>{st.label}</span>

                        <button
                          type="button"
                          onClick={(event) => handleDeleteWebsite(event, website)}
                          aria-label={`Delete ${website.name}`}
                          title="Delete monitor"
                          className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        </div>
      </main>

      {/* Add Monitor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-monitor-title"
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="relative w-full max-w-md bg-[#111118] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
              <button
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
                className="absolute top-5 right-5 p-1.5 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 id="add-monitor-title" className="text-2xl font-bold HeadingFont mb-1">Add a monitor</h3>
              <p className="text-sm text-gray-400 BodyFont mb-6">We'll start checking this site right away.</p>

              <form onSubmit={handleAddMonitor} className="space-y-5">
                {addError && (
                  <div role="alert" className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm BodyFont">
                    {addError}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="monitorName" className="text-sm font-medium text-gray-300 BodyFont">Name</label>
                  <input
                    id="monitorName"
                    type="text"
                    autoComplete="off"
                    autoFocus
                    value={newMonitor.name}
                    onChange={(e) => setNewMonitor((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all BodyFont"
                    placeholder="My website"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="monitorUrl" className="text-sm font-medium text-gray-300 BodyFont">URL</label>
                  <input
                    id="monitorUrl"
                    type="url"
                    autoComplete="off"
                    value={newMonitor.url}
                    onChange={(e) => setNewMonitor((prev) => ({ ...prev, url: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all BodyFont"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="monitorInterval" className="text-sm font-medium text-gray-300 BodyFont">Check frequency</label>
                  <select
                    id="monitorInterval"
                    value={newMonitor.checkInterval}
                    onChange={(e) => setNewMonitor((prev) => ({ ...prev, checkInterval: Number(e.target.value) }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all BodyFont"
                  >
                    {INTERVAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-[#111118]">{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3.5 text-sm font-semibold text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl transition-colors HeadingFont"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={addingMonitor}
                    className="flex-[1.5] py-3.5 bg-amber-500 text-black font-bold rounded-xl HeadingFont flex items-center justify-center disabled:opacity-60"
                  >
                    {addingMonitor ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Add monitor"}
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
