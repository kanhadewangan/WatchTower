import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export const Monitoring = () => {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [websiteMetrics, setWebsiteMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchWebsites();
  }, [navigate]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/api/v1/websites/websites`,
        { headers: getAuthHeaders() }
      );
      const data = response.data.websites || [];
      setWebsites(Array.isArray(data) ? data : []);

      if (data.length > 0) {
        await fetchAllWebsiteMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch websites:", error);
      setWebsites([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllWebsiteMetrics = async (websiteList) => {
    const metricsMap = {};

    await Promise.all(
      websiteList.map(async (website) => {
        try {
          const [uptimeRes, latestRes] = await Promise.all([
            axios.get(
              `${import.meta.env.VITE_URL}/api/v1/checks/uptime/${website.name}`,
              { headers: getAuthHeaders() }
            ).catch(() => ({ data: { uptimePercentage: 0, averageResponseTime: 0 } })),
            axios.get(
              `${import.meta.env.VITE_URL}/api/v1/checks/latest-check/${website.name}`,
              { headers: getAuthHeaders() }
            ).catch(() => ({ data: { latestCheck: null } }))
          ]);

          metricsMap[website.name] = {
            uptime: uptimeRes.data.uptimePercentage || 0,
            responseTime: uptimeRes.data.averageResponseTime || 0,
            latestCheck: latestRes.data.latestCheck,
            status: latestRes.data.latestCheck?.status || 'UNKNOWN'
          };
        } catch (err) {
          metricsMap[website.name] = {
            uptime: 0,
            responseTime: 0,
            latestCheck: null,
            status: 'UNKNOWN'
          };
        }
      })
    );

    setWebsiteMetrics(metricsMap);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UP':
        return 'text-green-500 border-green-500/20 bg-green-500/10';
      case 'DOWN':
        return 'text-red-500 border-red-500/20 bg-red-500/10';
      default:
        return 'text-gray-500 border-gray-500/20 bg-gray-500/10';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'UP':
        return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      case 'DOWN':
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const filteredWebsites = websites.filter(website => {
    const matchesSearch = website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      website.url.toLowerCase().includes(searchTerm.toLowerCase());
    const metrics = websiteMetrics[website.name];
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'up' && metrics?.status === 'UP') ||
      (statusFilter === 'down' && metrics?.status === 'DOWN') ||
      (statusFilter === 'unknown' && (!metrics || metrics.status === 'UNKNOWN'));
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: websites.length,
    up: websites.filter(w => websiteMetrics[w.name]?.status === 'UP').length,
    down: websites.filter(w => websiteMetrics[w.name]?.status === 'DOWN').length,
    unknown: websites.filter(w => !websiteMetrics[w.name] || websiteMetrics[w.name]?.status === 'UNKNOWN').length
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-amber-500 HeadingFont uppercase tracking-widest text-xs animate-pulse">Initializing Surveillance...</p>
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
        .animated-glow {
          background: radial-gradient(circle at center, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
        }
      `}</style>

      <div className="absolute inset-0 hex-grid pointer-events-none opacity-50" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] animated-glow pointer-events-none opacity-30" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => navigate("/")}
              >
                <motion.svg
                  whileHover={{ rotate: 180 }}
                  className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 4.5l-7.5 15h15L12 4.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </motion.svg>
                <h1 className="text-xl font-bold HeadingFont tracking-tight group-hover:text-amber-500 transition-colors">Watchtower</h1>
              </div>
              <div className="w-[1px] h-6 bg-white/10 hidden md:block" />
              <div>
                <h2 className="text-sm font-bold HeadingFont text-gray-400 uppercase tracking-widest">Active Monitors</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-xs font-bold HeadingFont border border-white/10 rounded-xl transition-all"
              >
                Command Center
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(245, 158, 11, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchWebsites}
                className="px-4 py-2 bg-amber-500 text-black text-xs font-bold HeadingFont rounded-xl flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Status
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Monitors', value: statusCounts.all, color: 'text-white' },
            { label: 'Operational', value: statusCounts.up, color: 'text-green-500' },
            { label: 'Critical', value: statusCounts.down, color: 'text-red-500' },
            { label: 'Unknown', value: statusCounts.unknown, color: 'text-gray-500' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111118]/60 border border-white/5 p-4 rounded-2xl"
            >
              <div className={`text-2xl font-black HeadingFont ${stat.color}`}>{String(stat.value).padStart(2, '0')}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 HeadingFont">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Global Controls */}
        <div className="bg-[#111118]/40 border border-white/5 p-2 rounded-2xl mb-8 flex flex-col lg:row gap-2">
          <div className="flex flex-col md:flex-row gap-2 grow">
            {/* Search Input */}
            <div className="relative grow group">
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filter endpoints by name or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/5 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 BodyFont text-sm placeholder-gray-700 transition-all"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex bg-[#0a0a0f] border border-white/5 p-1 rounded-xl shrink-0">
              {[
                { key: 'all', label: 'All' },
                { key: 'up', label: 'Online' },
                { key: 'down', label: 'Offline' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all HeadingFont ${statusFilter === filter.key
                      ? 'bg-amber-500 text-black'
                      : 'text-gray-500 hover:text-white'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Monitor Cards Grid */}
        <AnimatePresence mode="popLayout">
          {filteredWebsites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#111118]/20 border border-dashed border-white/10 rounded-3xl p-20 text-center"
            >
              <div className="mb-4 inline-flex p-4 rounded-full bg-white/5">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold HeadingFont mb-2">No signals detected.</h3>
              <p className="text-gray-500 BodyFont text-sm mb-6 max-w-xs mx-auto">Either your search parameters are invalid or no monitors have been configured for this sector.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold HeadingFont uppercase tracking-widest transition-all"
              >
                Return to Dashboard
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredWebsites.map((website) => {
                const metrics = websiteMetrics[website.name] || {};
                return (
                  <motion.div
                    key={website.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -5, borderColor: "rgba(245, 158, 11, 0.3)" }}
                    className="bg-[#111118]/80 border border-white/5 p-6 rounded-3xl transition-all cursor-pointer relative group overflow-hidden"
                    onClick={() => navigate(`/monitor/${website.name}`)}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                    </div>

                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(metrics.status)} animate-pulse`}></div>
                        <div>
                          <h3 className="font-black HeadingFont text-white group-hover:text-amber-500 transition-colors uppercase tracking-wide">{website.name}</h3>
                          <p className="text-[10px] text-gray-500 BodyFont truncate max-w-[150px] font-mono">{website.url}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black HeadingFont border ${getStatusColor(metrics.status)}`}>
                        {metrics.status || 'OFFLINE'}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1 BodyFont">Uptime</div>
                        <div className={`text-xl font-black HeadingFont ${metrics.uptime >= 99 ? 'text-green-500' : 'text-amber-500'}`}>
                          {(metrics.uptime || 0).toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1 BodyFont">Response</div>
                        <div className="text-xl font-black HeadingFont text-white">
                          {Math.round(metrics.responseTime || 0)}<span className="text-[10px] text-gray-600 ml-1">MS</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest HeadingFont">
                          {formatDate(metrics.latestCheck?.created_at)}
                        </span>
                      </div>
                      <motion.div
                        whileHover={{ x: 3 }}
                        className="text-amber-500/80 group-hover:text-amber-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistence Bar */}
      <footer className="py-8 text-center relative z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-800 HeadingFont font-black">
          Satellite Monitoring Network v2.4.0
        </p>
      </footer>
    </div>
  );
};

export default Monitoring;
