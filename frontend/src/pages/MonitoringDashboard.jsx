import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useCustomQuery } from "../hooks/useQuery";
import Sidebar from "../components/Sidebar";

const MAX_POINTS = 90;
const LOG_LIMIT = 50;

const TIME_FILTERS = [
  { key: "1-hour", label: "1H", value: "last-1-hour" },
  { key: "24-hours", label: "24H", value: "last-24-hours" },
  { key: "7-days", label: "7D", value: "last-7-days" },
  { key: "30-days", label: "30D", value: "last-30-days" },
];

const REGIONS = [
  { key: "US_EAST_1", label: "US East (Virginia)" },
  { key: "US_WEST_1", label: "US West (California)" },
  { key: "EU_CENTRAL_1", label: "Europe (Frankfurt)" },
  { key: "AP_SOUTHEAST_1", label: "Asia Pacific (Singapore)" },
];

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Averages checks into at most MAX_POINTS buckets so long ranges (30D can be ~43k checks) stay fast and readable.
const bucketChecks = (checks, longRange) => {
  if (!checks.length) return [];
  const size = Math.max(1, Math.ceil(checks.length / MAX_POINTS));
  const points = [];
  for (let i = 0; i < checks.length; i += size) {
    const group = checks.slice(i, i + size);
    const date = new Date(group[0].created_at);
    const up = group.filter((c) => c.status === "UP").length;
    points.push({
      label: longRange
        ? date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      responseTime: Math.round(group.reduce((sum, c) => sum + (c.response_time || 0), 0) / group.length),
      uptime: Math.round((up / group.length) * 1000) / 10,
      checks: group.length,
    });
  }
  return points;
};

const ChartTooltip = ({ active, payload, unit, name }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{p.label}</p>
      <p className="font-bold text-white">
        {payload[0].value}
        {unit} <span className="font-normal text-gray-500">{name}</span>
      </p>
      {p.checks > 1 && <p className="text-gray-500 mt-0.5">avg of {p.checks} checks</p>}
    </div>
  );
};

const MonitoringDashboard = () => {
  const navigate = useNavigate();
  const { websitename } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [timeFilter, setTimeFilter] = useState("24-hours");
  const [selectedRegion, setSelectedRegion] = useState("US_EAST_1");

  // UI states
  const [showStartModal, setShowStartModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const apiBase = `${import.meta.env.VITE_URL}/api/v1/checks`;
  const siteParam = encodeURIComponent(websitename);

  // Summary: all-time uptime stats + the latest check
  const summary = useCustomQuery(["summary", websitename], async () => {
    const [uptimeRes, latestRes] = await Promise.all([
      axios.get(`${apiBase}/uptime/${siteParam}`, { headers: getAuthHeaders() }),
      axios.get(`${apiBase}/latest-check/${siteParam}`, { headers: getAuthHeaders() }),
    ]);
    return { uptimeStats: uptimeRes.data, latestCheck: latestRes.data.latestCheck };
  });

  // Checks for the selected time range (keeps the old chart on screen while a new range loads)
  const checksQuery = useCustomQuery(
    ["checks", websitename, timeFilter],
    async () => {
      const filter = TIME_FILTERS.find((f) => f.key === timeFilter) || TIME_FILTERS[1];
      try {
        const res = await axios.get(`${apiBase}/${filter.value}/${siteParam}`, { headers: getAuthHeaders() });
        return res.data.checks || [];
      } catch (err) {
        if (err.response?.status === 404) return [];
        throw err;
      }
    },
    { placeholderData: keepPreviousData }
  );

  const uptimeStats = summary.data?.uptimeStats || { uptimePercentage: 0, averageResponseTime: 0, errorMetric: 0 };
  const latestCheck = summary.data?.latestCheck || null;
  const checks = checksQuery.data || [];

  // Expired/invalid token -> back to login
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    const status = summary.error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [summary.error, navigate]);

  const { refetch: refetchSummary } = summary;
  const { refetch: refetchChecks } = checksQuery;
  const refreshAll = () => {
    refetchSummary();
    refetchChecks();
  };

  const startMonitoring = async () => {
    try {
      setActionLoading(true);
      setActionError("");
      await axios.post(
        `${apiBase}/add-check`,
        { websitename, region: selectedRegion },
        { headers: getAuthHeaders() }
      );
      setShowStartModal(false);
      setTimeout(refreshAll, 2000);
    } catch (err) {
      setActionError(err.response?.data?.message || "Couldn't start monitoring. Please try again.");
      setShowStartModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAllChecks = async () => {
    try {
      setActionLoading(true);
      setActionError("");
      await axios.delete(`${apiBase}/checks/${siteParam}`, { headers: getAuthHeaders() });
      setShowDeleteModal(false);
      refreshAll();
    } catch (err) {
      setActionError(err.response?.data?.message || "Couldn't delete the check history. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const longRange = timeFilter === "7-days" || timeFilter === "30-days";
  const chartData = bucketChecks(checks, longRange);
  const recentChecks = checks.slice(-LOG_LIMIT).reverse();

  const loading = summary.isLoading;
  const error = summary.isError
    ? summary.error?.response?.status === 404
      ? `We couldn't find a monitor named "${websitename}".`
      : "Failed to load monitoring data. Please try again."
    : null;

  if (error) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-w-0 flex items-center justify-center flex-col space-y-4">
          <h2 className="text-red-400 text-xl sm:text-2xl font-bold HeadingFont text-center px-6">{error}</h2>
          <div className="flex gap-3">
            <button onClick={refreshAll} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg HeadingFont transition-colors text-sm">Try again</button>
            <button onClick={() => navigate('/monitor')} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg HeadingFont transition-colors text-sm">Back to monitors</button>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-amber-500 HeadingFont uppercase tracking-widest text-xs animate-pulse">Decrypting Signal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-hidden flex relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
        .hex-grid {
          background-image: radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.05) 1px, transparent 0);
          background-size: 32px 32px;
        }
        .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line {
          stroke: rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="absolute inset-0 hex-grid pointer-events-none opacity-50" />

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative z-10">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-white/5 text-gray-500 transition lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/monitor")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <svg className="w-5 h-5 text-amber-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-xs font-black HeadingFont uppercase tracking-widest hidden md:block">Sector Overview</span>
            </motion.div>
            <div className="w-[px] h-4 bg-white/10" />
            <h1 className="text-sm font-black HeadingFont uppercase tracking-[0.2em] text-white/40">Monitor: <span className="text-white">{websitename}</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={refreshAll}
              className="p-2 border border-white/5 rounded-lg hover:bg-white/5 transition-colors"
              title="Refresh" aria-label="Refresh"
            >
              <svg className={`w-4 h-4 text-gray-500 ${summary.isFetching || checksQuery.isFetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>
  
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-14 relative z-10">
        {actionError && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <span>{actionError}</span>
            <button onClick={() => setActionError("")} aria-label="Dismiss" className="text-red-300/80 hover:text-white">✕</button>
          </div>
        )}
        {/* Signal Overview Hero */}
        <section className="mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111118]/80 border border-white/5 rounded-4xl p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-100 h-100 bg-amber-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${latestCheck?.status === 'UP' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'} animate-pulse`} />
                  <span className="text-xs font-black HeadingFont uppercase tracking-[0.3em] text-gray-500">Live Surveillance System</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black HeadingFont mb-5 tracking-tight uppercase">{websitename}</h2>
                {latestCheck ? (
                  <p className="text-gray-400 BodyFont text-sm max-w-xl">
                    {latestCheck.status === "UP" ? "Last check passed" : "Last check failed"}
                    {" "}in <span className="text-amber-500 font-bold">{latestCheck.response_time}ms</span> at {new Date(latestCheck.created_at).toLocaleString()}
                    {latestCheck.region ? <> from <span className="text-amber-500 font-bold">{latestCheck.region}</span></> : null}.
                  </p>
                ) : (
                  <p className="text-gray-500 BodyFont text-sm max-w-xl">No checks yet. Start monitoring to see results here.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowStartModal(true)}
                  className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-black HeadingFont uppercase tracking-widest text-xs"
                >
                  Enlist New Check
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(220, 38, 38, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(true)}
                  className="border border-red-500/20 text-red-500 px-8 py-4 rounded-2xl font-black HeadingFont uppercase tracking-widest text-xs"
                >
                  Protocol Wipe
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-14">
          {[
            { label: "Uptime (all time)", value: `${uptimeStats.uptimePercentage.toFixed(2)}%`, color: uptimeStats.uptimePercentage >= 95 || !latestCheck ? "text-green-500" : "text-red-400" },
            { label: "Avg response time", value: `${Math.round(uptimeStats.averageResponseTime)}ms`, color: "text-white" },
            { label: "Error rate", value: `${uptimeStats.errorMetric.toFixed(1)}%`, color: uptimeStats.errorMetric > 5 ? "text-red-400" : "text-white/60" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-[#111118]/40 border border-white/5 p-8 rounded-3xl"
            >
              <div className="text-xs font-black HeadingFont text-gray-600 uppercase tracking-widest mb-4">{stat.label}</div>
              <div className={`text-3xl font-black HeadingFont ${stat.color}`}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Analytics Section: always rendered so the range picker never disappears */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xs font-black HeadingFont uppercase tracking-[0.3em] text-gray-500">Performance</h3>
          <div className="flex bg-[#0a0a0f] p-1 rounded-xl self-start">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTimeFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black HeadingFont transition-all ${timeFilter === f.key ? "bg-amber-500 text-black" : "text-gray-500 hover:text-white"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14 transition-opacity ${checksQuery.isPlaceholderData ? "opacity-50" : ""}`}>
          <div className="bg-[#111118]/60 border border-white/5 p-6 sm:p-8 rounded-[2rem]">
            <h4 className="text-sm font-bold HeadingFont text-gray-300 mb-1">Response time</h4>
            <p className="text-xs text-gray-500 BodyFont mb-6">Milliseconds per check (lower is better)</p>
            <div className="h-72 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500 BodyFont">No checks in this time range.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={48} />
                    <YAxis width={48} tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, "auto"]} tickFormatter={(v) => `${v}ms`} />
                    <Tooltip content={<ChartTooltip unit="ms" name="response time" />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
                    <Area type="monotone" dataKey="responseTime" stroke="#f59e0b" strokeWidth={2.5} fill="url(#glow)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[#111118]/60 border border-white/5 p-6 sm:p-8 rounded-[2rem]">
            <h4 className="text-sm font-bold HeadingFont text-gray-300 mb-1">Availability</h4>
            <p className="text-xs text-gray-500 BodyFont mb-6">Share of checks that passed (red = some failed)</p>
            <div className="h-72 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500 BodyFont">No checks in this time range.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={48} />
                    <YAxis width={48} tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<ChartTooltip unit="%" name="passed" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="uptime" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {chartData.map((p, idx) => (
                        <Cell key={idx} fill={p.uptime >= 100 ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Check log */}
        <section className="bg-[#111118]/20 border border-white/5 rounded-[2rem] p-6 sm:p-10">
          <div className="flex items-baseline justify-between gap-4 mb-8">
            <h3 className="text-xs font-black HeadingFont uppercase tracking-[0.3em] text-gray-500">Recent checks</h3>
            {checks.length > LOG_LIMIT && (
              <span className="text-xs text-gray-600 BodyFont">Latest {LOG_LIMIT} of {checks.length.toLocaleString()}</span>
            )}
          </div>
          <div className="space-y-3">
            {recentChecks.map((check) => (
              <div
                key={check.id}
                className="bg-[#111118]/40 hover:bg-[#111118]/80 border border-white/5 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${check.status === "UP" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className={`w-12 text-xs font-black HeadingFont uppercase tracking-widest ${check.status === "UP" ? "text-green-500" : "text-red-500"}`}>{check.status}</span>
                  <span className="text-sm text-gray-200 BodyFont">{new Date(check.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 BodyFont pl-6 sm:pl-0">
                  {check.region && <span className="px-2 py-0.5 rounded bg-white/5 uppercase tracking-tight">{check.region}</span>}
                  <span className="font-mono">{check.status_code || "no response"}</span>
                  <span className="font-mono">{check.response_time}ms</span>
                </div>
              </div>
            ))}
            {recentChecks.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-500 BodyFont">No checks in this time range yet.</div>
            )}
          </div>
        </section>
      </main>

      {/* Start Monitoring Modal */}
      <AnimatePresence>
        {showStartModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStartModal(false)}
              className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111118] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-3xl"
            >
              <h3 className="text-2xl font-black HeadingFont uppercase tracking-tight mb-2">Initiate Deployment</h3>
              <p className="text-gray-500 BodyFont text-sm mb-8">Select target regional cluster for the surveillance payload.</p>

              <div className="space-y-6 mb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black HeadingFont uppercase tracking-[0.2em] text-gray-600 ml-1">Target Cluster</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-4 text-sm font-bold HeadingFont focus:ring-1 focus:ring-amber-500/50 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {REGIONS.map(r => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startMonitoring}
                  disabled={actionLoading}
                  className="w-full py-4 bg-amber-500 text-black font-black HeadingFont uppercase tracking-widest text-xs rounded-xl flex items-center justify-center disabled:opacity-50"
                >
                  {actionLoading ? "Transmitting..." : "Execute Enlistment"}
                </motion.button>
                <button
                  onClick={() => setShowStartModal(false)}
                  className="w-full py-4 text-xs font-black HeadingFont uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                  Abort Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-red-950/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111118] border border-red-500/20 w-full max-w-md rounded-[2.5rem] p-10 relative z-10"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black HeadingFont uppercase tracking-tight mb-2">Protocol Wipe</h3>
              <p className="text-gray-500 BodyFont text-sm mb-10">Are you sure you want to terminate and purge all historical data for <span className="text-white font-bold">{websitename}</span>? This action is irreversible.</p>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteAllChecks}
                  disabled={actionLoading}
                  className="w-full py-4 bg-red-600 text-white font-black HeadingFont uppercase tracking-widest text-xs rounded-xl disabled:opacity-50"
                >
                  Confirm Mass Purge
                </motion.button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 text-xs font-black HeadingFont uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                  Cancel Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-white/5 bg-[#0a0a0f] text-center">
        <p className="text-[10px] uppercase tracking-[0.8em] text-gray-800 HeadingFont font-black">
          System Uptime Registry • Core Engine v4.2.0
        </p>
      </footer>
      </div>
    </div>
  );

}



export default MonitoringDashboard;
