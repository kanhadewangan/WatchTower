import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts";

const MonitoringDashboard = () => {
  const navigate = useNavigate();
  const { websitename } = useParams();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [uptimeStats, setUptimeStats] = useState({
    uptimePercentage: 0,
    averageResponseTime: 0,
    errorMetric: 0
  });
  const [latestCheck, setLatestCheck] = useState(null);
  const [checks, setChecks] = useState([]);
  const [timeFilter, setTimeFilter] = useState('24-hours');
  const [selectedRegion, setSelectedRegion] = useState('US_EAST_1');

  // UI states
  const [showStartModal, setShowStartModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const timeFilters = [
    { key: '1-hour', label: '1H', value: 'last-1-hour' },
    { key: '24-hours', label: '24H', value: 'last-24-hours' },
    { key: '7-days', label: '7D', value: 'last-7-days' },
    { key: '30-days', label: '30D', value: 'last-30-days' }
  ];

  const regions = [
    { key: 'US_EAST_1', label: 'US East (Virginia)' },
    { key: 'US_WEST_1', label: 'US West (California)' },
    { key: 'EU_WEST_1', label: 'Europe (Ireland)' },
    { key: 'AP_SOUTH_1', label: 'Asia Pacific (Mumbai)' }
  ];

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (websitename) fetchAllData();
  }, [websitename, navigate]);

  // Fetch data when time filter changes
  useEffect(() => {
    if (websitename && !loading) fetchChecks();
  }, [timeFilter]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchUptimeStats(), fetchLatestCheck(), fetchChecks()]);
    } catch (err) {
      setError("Surveillance signal lost. Failed to fetch monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUptimeStats = async () => {
    const response = await axios.get(`${import.meta.env.VITE_URL}/api/v1/checks/uptime/${websitename}`, { headers: getAuthHeaders() });
    setUptimeStats(response.data);
  };

  const fetchLatestCheck = async () => {
    const response = await axios.get(`${import.meta.env.VITE_URL}/api/v1/checks/latest-check/${websitename}`, { headers: getAuthHeaders() });
    setLatestCheck(response.data.latestCheck);
  };

  const fetchChecks = async () => {
    const filterValue = timeFilters.find(f => f.key === timeFilter)?.value || 'last-24-hours';
    const response = await axios.get(`${import.meta.env.VITE_URL}/api/v1/checks/${filterValue}/${websitename}`, { headers: getAuthHeaders() });
    setChecks(response.data.checks || []);
  };

  const startMonitoring = async () => {
    try {
      setActionLoading(true);
      await axios.post(`${import.meta.env.VITE_URL}/api/v1/checks/add-check`, { websitename, reigon: selectedRegion }, { headers: getAuthHeaders() });
      setShowStartModal(false);
      setTimeout(fetchAllData, 2000);
    } catch (err) {
      setError("Failed to initiate deployment.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAllChecks = async () => {
    try {
      setActionLoading(true);
      await axios.delete(`${import.meta.env.VITE_URL}/api/v1/checks/checks/${websitename}`, { headers: getAuthHeaders() });
      setShowDeleteModal(false);
      fetchAllData();
    } catch (err) {
      setError("Protocol wipe failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => status === 'UP' ? 'text-green-500' : 'text-red-500';
  const getStatusBg = (status) => status === 'UP' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';

  const prepareChartData = () => {
    if (!checks || checks.length === 0) return [];
    return checks.slice().reverse().map(check => ({
      time: new Date(check.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: check.response_time || 0,
      status: check.status === 'UP' ? 1 : 0,
      fullDate: new Date(check.created_at).toLocaleString()
    }));
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-amber-500 HeadingFont uppercase tracking-widest text-xs animate-pulse">Decrypting Signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-x-hidden relative">
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

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
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
            <div className="w-[1px] h-4 bg-white/10" />
            <h1 className="text-sm font-black HeadingFont uppercase tracking-[0.2em] text-white/40">Monitor: <span className="text-white">{websitename}</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => fetchAllData()}
              className="p-2 border border-white/5 rounded-lg hover:bg-white/5 transition-colors"
              title="Refresh Signal"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Signal Overview Hero */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111118]/80 border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${latestCheck?.status === 'UP' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'} animate-pulse`} />
                  <span className="text-xs font-black HeadingFont uppercase tracking-[0.3em] text-gray-500">Live Surveillance System</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black HeadingFont mb-4 tracking-tighter uppercase">{websitename}</h2>
                {latestCheck && (
                  <p className="text-gray-400 BodyFont text-sm max-w-xl">
                    Operational status verified from <span className="text-amber-500 font-bold">{latestCheck.reigon}</span> at {new Date(latestCheck.created_at).toLocaleTimeString()}. All systems green.
                  </p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Uptime Protocol', value: `${uptimeStats.uptimePercentage.toFixed(2)}%`, color: 'text-green-500', trend: 'STABLE' },
            { label: 'Signal Latency', value: `${Math.round(uptimeStats.averageResponseTime)}ms`, color: 'text-white', trend: 'OPTIMAL' },
            { label: 'Error Margin', value: `${uptimeStats.errorMetric.toFixed(1)}%`, color: 'text-white/40', trend: 'MINIMAL' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-[#111118]/40 border border-white/5 p-8 rounded-3xl relative group"
            >
              <div className="text-xs font-black HeadingFont text-gray-600 uppercase tracking-widest mb-4 flex justify-between">
                {stat.label}
                <span className="text-[10px] text-amber-500/30 group-hover:text-amber-500 transition-colors uppercase">{stat.trend}</span>
              </div>
              <div className={`text-4xl font-black HeadingFont ${stat.color}`}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Analytics Section */}
        {checks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111118]/60 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black HeadingFont uppercase tracking-[0.3em] text-gray-500">Latency Dynamics</h3>
                <div className="flex bg-[#0a0a0f] p-1 rounded-xl">
                  {timeFilters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setTimeFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black HeadingFont transition-all ${timeFilter === f.key ? 'bg-amber-500 text-black' : 'text-gray-600 hover:text-white'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis hide dataKey="time" />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px', fontFamily: 'Space Grotesk' }}
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Area type="monotone" dataKey="responseTime" stroke="#f59e0b" strokeWidth={3} fill="url(#glow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111118]/60 border border-white/5 p-8 rounded-[2.5rem]"
            >
              <h3 className="text-xs font-black HeadingFont uppercase tracking-[0.3em] text-gray-500 mb-8">Signal Reliability</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis hide dataKey="time" />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px' }}
                      formatter={(v) => v === 1 ? 'SIGNAL LOCK' : 'SIGNAL LOST'}
                    />
                    <Bar dataKey="status" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}

        {/* Operational Log */}
        <section className="bg-[#111118]/20 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
          <h3 className="text-xs font-black HeadingFont uppercase tracking-[0.4em] text-gray-600 mb-10">Verification Registry</h3>
          <div className="space-y-4">
            {checks.map((check, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-[#111118]/40 hover:bg-[#111118]/80 border border-white/5 rounded-2xl p-5 flex flex-col md:row md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${check.status === 'UP' ? 'bg-green-500 glow-green' : 'bg-red-500 glow-red'}`} />
                    <span className={`text-[10px] font-black HeadingFont uppercase tracking-widest ${check.status === 'UP' ? 'text-green-500' : 'text-red-500'}`}>{check.status}</span>
                  </div>
                  <div className="w-[1px] h-4 bg-white/5" />
                  <div>
                    <div className="text-xs font-bold text-white mb-1 HeadingFont uppercase tracking-tight">{new Date(check.created_at).toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 BodyFont flex items-center gap-2">
                      <span className="p-1 rounded bg-white/5 uppercase tracking-tighter">{check.reigon}</span>
                      <span className="opacity-30">•</span>
                      <span className="font-mono tracking-tighter uppercase">Payload received in {check.response_time}ms</span>
                    </div>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.1 }} className="text-gray-700 group-hover:text-amber-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
              </motion.div>
            ))}
            {checks.length === 0 && (
              <div className="py-20 text-center opacity-20">
                <p className="HeadingFont uppercase tracking-widest text-xs">Awaiting First Signal Transmission...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Start Monitoring Modal */}
      <AnimatePresence>
        {showStartModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
                    {regions.map(r => (
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
  );
};

export default MonitoringDashboard;
