import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      
      // Fetch metrics for each website
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'DOWN':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'UP':
        return 'bg-green-500';
      case 'DOWN':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: "linear-gradient(135deg, #F8FAFC 0%, #DBE6E1 50%, #E6FFFA 100%)",
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#319795] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading monitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, #F8FAFC 0%, #DBE6E1 50%, #E6FFFA 100%)",
    }}>
      {/* Header */}
      <header className="bg-white border-b border-[#DBE6E1] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B]">All Monitors</h1>
              <p className="text-sm text-[#64748B]">Track and manage all your monitored websites</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border border-[#DBE6E1] text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition"
              >
                Back to Dashboard
              </button>
              <button
                onClick={fetchWebsites}
                className="px-4 py-2 bg-[#319795] text-white rounded-lg hover:bg-[#2C7A7B] transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-4">
            <div className="text-2xl font-bold text-[#1E293B]">{statusCounts.all}</div>
            <div className="text-sm text-[#64748B]">Total Monitors</div>
          </div>
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.up}</div>
            <div className="text-sm text-[#64748B]">Online</div>
          </div>
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.down}</div>
            <div className="text-sm text-[#64748B]">Offline</div>
          </div>
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-4">
            <div className="text-2xl font-bold text-gray-500">{statusCounts.unknown}</div>
            <div className="text-sm text-[#64748B]">Unknown</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#DBE6E1] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search monitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#DBE6E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'up', label: 'Online' },
                { key: 'down', label: 'Offline' },
                { key: 'unknown', label: 'Unknown' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === filter.key
                      ? 'bg-[#319795] text-white'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E6FFFA]'
                  }`}
                >
                  {filter.label} ({statusCounts[filter.key]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Websites Grid */}
        {filteredWebsites.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No monitors found</h3>
            <p className="text-[#64748B] mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first monitor to get started'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#319795] text-white rounded-lg hover:bg-[#2C7A7B] transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebsites.map((website) => {
              const metrics = websiteMetrics[website.name] || {};
              return (
                <div
                  key={website.id}
                  className="bg-white rounded-xl border border-[#DBE6E1] p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/monitor/${website.name}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusDot(metrics.status)}`}></div>
                      <div>
                        <h3 className="font-semibold text-[#1E293B]">{website.name}</h3>
                        <p className="text-xs text-[#64748B] truncate max-w-[180px]">{website.url}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(metrics.status)}`}>
                      {metrics.status || 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className={`text-lg font-bold ${getUptimeColor(metrics.uptime || 0)}`}>
                        {(metrics.uptime || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-[#64748B]">Uptime</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#1E293B]">
                        {Math.round(metrics.responseTime || 0)}ms
                      </div>
                      <div className="text-xs text-[#64748B]">Avg Response</div>
                    </div>
                  </div>

                  {/* Last Check */}
                  <div className="pt-4 border-t border-[#DBE6E1]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Last checked</span>
                      <span className="text-xs text-[#1E293B]">
                        {formatDate(metrics.latestCheck?.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    className="w-full mt-4 py-2 text-sm font-medium text-[#319795] hover:bg-[#E6FFFA] rounded-lg transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/monitor/${website.name}`);
                    }}
                  >
                    View Details →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;
