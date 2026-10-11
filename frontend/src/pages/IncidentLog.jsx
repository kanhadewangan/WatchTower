import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useCustomQuery } from "../hooks/useQuery";
import Sidebar from "../components/Sidebar";

const RANGES = [
  { days: 1, label: "24H" },
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "ONGOING", label: "Ongoing" },
  { key: "RESOLVED", label: "Resolved" },
];

const formatDuration = (ms) => {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return "< 1 min";
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
};

const formatTime = (iso) =>
  new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const describeCodes = (codes) => {
  const real = (codes || []).filter((c) => c > 0);
  const noResponse = (codes || []).includes(0);
  const parts = [...real.map(String), ...(noResponse ? ["no response"] : [])];
  return parts.length ? parts.join(", ") : "—";
};

const IncidentLog = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isError, error, refetch, isFetching } = useCustomQuery(["incidents", days], async () => {
    const res = await axios.get(`${import.meta.env.VITE_URL}/api/v1/checks/incidents`, {
      params: { days },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data.incidents || [];
  });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [error, navigate]);

  const incidents = data || [];
  const ongoing = incidents.filter((i) => i.status === "ONGOING");
  const resolved = incidents.filter((i) => i.status === "RESOLVED");
  const avgResolveMs = resolved.length ? resolved.reduce((s, i) => s + i.durationMs, 0) / resolved.length : null;
  const visible = incidents.filter((i) => statusFilter === "all" || i.status === statusFilter);

  const summary = [
    { label: "Total incidents", value: incidents.length, tone: "text-white" },
    { label: "Ongoing", value: ongoing.length, tone: ongoing.length ? "text-red-400" : "text-green-400" },
    { label: "Resolved", value: resolved.length, tone: "text-white" },
    { label: "Avg. time to resolve", value: avgResolveMs === null ? "—" : formatDuration(avgResolveMs), tone: "text-white" },
  ];

  return (
    <div className="h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-hidden flex relative font-['Inter']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
        button:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; }
      `}</style>
      <div className="absolute -top-40 right-0 w-[520px] h-[520px] rounded-full bg-red-500/[0.07] blur-[130px] pointer-events-none" />

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <header className="h-20 shrink-0 bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/5 flex items-center justify-between gap-4 px-5 sm:px-10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="p-2 rounded-xl hover:bg-white/5 text-gray-400 transition lg:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold HeadingFont tracking-tight">Incident log</h2>
              <p className="text-xs text-gray-500 BodyFont truncate">Every time one of your sites failed its checks</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Refresh"
            title="Refresh"
            className="p-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
          >
            <svg className={`w-4 h-4 text-gray-400 ${isFetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {summary.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 sm:p-7">
                <p className="text-sm text-gray-400 BodyFont mb-3">{s.label}</p>
                <p className={`text-3xl font-bold HeadingFont tracking-tight ${s.tone}`}>{isLoading ? "…" : s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-[#111118] border border-white/5 p-1 rounded-xl self-start">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold HeadingFont transition-all ${statusFilter === f.key ? "bg-amber-500 text-black" : "text-gray-500 hover:text-white"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex bg-[#111118] border border-white/5 p-1 rounded-xl self-start">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold HeadingFont transition-all ${days === r.days ? "bg-amber-500 text-black" : "text-gray-500 hover:text-white"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <section className="rounded-2xl border border-white/10 bg-[#111118]/70 overflow-hidden">
            {isLoading ? (
              <div className="py-24 flex justify-center">
                <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : isError ? (
              <div className="py-20 text-center px-6">
                <p className="text-red-400 font-semibold HeadingFont mb-4">Couldn't load incidents.</p>
                <button onClick={() => refetch()} className="px-5 py-2.5 bg-amber-500 text-black font-bold rounded-xl HeadingFont text-sm">Try again</button>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-24 text-center px-6">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold HeadingFont mb-1">
                  {incidents.length === 0 ? "No incidents" : "Nothing matches this filter"}
                </h4>
                <p className="text-sm text-gray-500 BodyFont">
                  {incidents.length === 0
                    ? `None of your sites have failed a check in the last ${days === 1 ? "24 hours" : `${days} days`}.`
                    : "Try a different status or time range."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {visible.map((inc, i) => {
                  const isOngoing = inc.status === "ONGOING";
                  return (
                    <motion.li
                      key={`${inc.websiteId}-${inc.startedAt}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 10) * 0.03 }}
                    >
                      <button
                        onClick={() => navigate(`/monitor/${encodeURIComponent(inc.websiteName)}`)}
                        className="w-full text-left px-6 sm:px-10 py-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0 md:flex-1">
                          <span className="relative flex h-3 w-3 shrink-0">
                            {isOngoing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />}
                            <span className={`relative inline-flex h-3 w-3 rounded-full ${isOngoing ? "bg-red-500" : "bg-green-500"}`} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold HeadingFont truncate">{inc.websiteName}</p>
                            <p className="text-xs text-gray-500 font-mono truncate">{inc.websiteUrl}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 md:flex md:gap-8 text-sm pl-7 md:pl-0">
                          <div>
                            <p className="text-gray-200 BodyFont">{formatTime(inc.startedAt)}</p>
                            <p className="text-[11px] text-gray-500 BodyFont">started</p>
                          </div>
                          <div>
                            <p className="text-gray-200 BodyFont">{formatDuration(inc.durationMs)}</p>
                            <p className="text-[11px] text-gray-500 BodyFont">{isOngoing ? "so far" : "duration"}</p>
                          </div>
                          <div>
                            <p className="text-gray-200 BodyFont">{inc.failedChecks} · {describeCodes(inc.statusCodes)}</p>
                            <p className="text-[11px] text-gray-500 BodyFont">failed checks · code</p>
                          </div>
                        </div>

                        <span
                          className={`self-start md:self-center text-xs font-semibold px-3 py-1 rounded-full border ${
                            isOngoing ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-green-400 bg-green-500/10 border-green-500/20"
                          }`}
                        >
                          {isOngoing ? "Ongoing" : `Resolved ${formatTime(inc.resolvedAt)}`}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default IncidentLog;
