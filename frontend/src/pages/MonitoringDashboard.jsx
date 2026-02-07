import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
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
  Legend
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
    { key: '1-hour', label: 'Last Hour', value: 'last-1-hour' },
    { key: '24-hours', label: 'Last 24 Hours', value: 'last-24-hours' },
    { key: '7-days', label: 'Last 7 Days', value: 'last-7-days' },
    { key: '30-days', label: 'Last 30 Days', value: 'last-30-days' }
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
    
    if (websitename) {
      fetchAllData();
    }
  }, [websitename, navigate]);

  // Fetch data when time filter changes
  useEffect(() => {
    if (websitename && !loading) {
      fetchChecks();
    }
  }, [timeFilter]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchUptimeStats(),
        fetchLatestCheck(),
        fetchChecks()
      ]);
    } catch (err) {
      setError("Failed to fetch monitoring data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUptimeStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/api/v1/checks/uptime/${websitename}`,
        { headers: getAuthHeaders() }
      );
      setUptimeStats(response.data);
    } catch (err) {
      console.error("Error fetching uptime stats:", err);
    }
  };

  const fetchLatestCheck = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/api/v1/checks/latest-check/${websitename}`,
        { headers: getAuthHeaders() }
      );
      setLatestCheck(response.data.latestCheck);
    } catch (err) {
      console.error("Error fetching latest check:", err);
    }
  };

  const fetchChecks = async () => {
    try {
      const filterValue = timeFilters.find(f => f.key === timeFilter)?.value || 'last-24-hours';
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/api/v1/checks/${filterValue}/${websitename}`,
        { headers: getAuthHeaders() }
      );
      setChecks(response.data.checks || []);
    } catch (err) {
      console.error("Error fetching checks:", err);
    }
  };

  const startMonitoring = async () => {
    try {
      setActionLoading(true);
      await axios.post(
        `${import.meta.env.VITE_URL}/api/v1/checks/add-check`,
        {
          websitename: websitename,
          reigon: selectedRegion
        },
        { headers: getAuthHeaders() }
      );
      
      setShowStartModal(false);
      // Refresh data after starting monitoring
      setTimeout(() => {
        fetchAllData();
      }, 2000);
      
      alert("Monitoring started successfully! You'll receive an email confirmation.");
    } catch (err) {
      console.error("Error starting monitoring:", err);
      alert("Failed to start monitoring. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAllChecks = async () => {
    try {
      setActionLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_URL}/api/v1/checks/checks/${websitename}`,
        { headers: getAuthHeaders() }
      );
      
      setShowDeleteModal(false);
      fetchAllData();
      alert("All monitoring data deleted successfully!");
    } catch (err) {
      console.error("Error deleting checks:", err);
      alert("Failed to delete monitoring data. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    return status === 'UP' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getUptimeColor = (percentage) => {
    if (percentage >= 99) return 'text-green-100';
    if (percentage >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Prepare chart data from checks
  const prepareChartData = () => {
    if (!checks || checks.length === 0) return [];
    
    return checks
      .slice()
      .reverse()
      .map((check) => ({
        time: new Date(check.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        date: new Date(check.created_at).toLocaleDateString([], {
          month: 'short',
          day: 'numeric'
        }),
        responseTime: check.response_time || 0,
        status: check.status === 'UP' ? 1 : 0,
        statusLabel: check.status,
        region: check.reigon,
        fullDate: new Date(check.created_at).toLocaleString()
      }));
  };

  const chartData = prepareChartData();

  // Calculate status distribution
  const getStatusDistribution = () => {
    if (!checks || checks.length === 0) return { up: 0, down: 0, total: 0 };
    const up = checks.filter(c => c.status === 'UP').length;
    const down = checks.filter(c => c.status === 'DOWN').length;
    return { up, down, total: checks.length };
  };

  const statusDistribution = getStatusDistribution();

  // Custom tooltip for response time chart
  const ResponseTimeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-[#DBE6E1] rounded-lg shadow-lg">
          <p className="text-sm font-medium text-[#1E293B]">{payload[0]?.payload?.fullDate}</p>
          <p className="text-sm text-[#319795]">
            Response Time: <span className="font-semibold">{payload[0]?.value}ms</span>
          </p>
          <p className="text-sm text-[#64748B]">
            Status: <span className={payload[0]?.payload?.statusLabel === 'UP' ? 'text-green-600' : 'text-red-600'}>
              {payload[0]?.payload?.statusLabel}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for status chart
  const StatusTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-[#DBE6E1] rounded-lg shadow-lg">
          <p className="text-sm font-medium text-[#1E293B]">{payload[0]?.payload?.fullDate}</p>
          <p className={`text-sm font-semibold ${payload[0]?.payload?.statusLabel === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
            {payload[0]?.payload?.statusLabel}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#319795] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, #F8FAFC 0%, #DBE6E1 50%, #E6FFFA 100%)",
    }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-[#319795] via-[#2C7A7B] to-[#285E61] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Monitoring Dashboard
            </h1>
            <p className="text-xl text-[#B2F5EA] mb-2">
              Real-time monitoring for <span className="font-semibold text-[#E6FFFA]">{websitename}</span>
            </p>
            {latestCheck && (
              <p className="text-sm text-[#B2F5EA]">
                Last checked: {formatDate(latestCheck.created_at)}
              </p>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className={`text-3xl font-bold mb-2 ${getUptimeColor(uptimeStats.uptimePercentage)}`}>
                {uptimeStats.uptimePercentage.toFixed(2)}%
              </div>

              <div className="text-[#B2F5EA] text-sm">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-[#E6FFFA] mb-2">
                {Math.round(uptimeStats.averageResponseTime)}ms
              </div>
              <div className="text-[#B2F5EA] text-sm">Avg Response Time</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-[#E6FFFA] mb-2">
                {uptimeStats.errorMetric.toFixed(1)}%
              </div>
              <div className="text-[#B2F5EA] text-sm">Error Rate</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowStartModal(true)}
              className="bg-white text-[#319795] px-6 py-3 rounded-lg font-semibold hover:bg-[#F0FDFA] transition"
            >
              Start New Monitoring
            </button>
            <button
              onClick={() => fetchAllData()}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#319795] transition"
            >
              Refresh Data
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="border-2 border-red-300 text-red-100 px-6 py-3 rounded-lg font-semibold hover:bg-red-500 hover:border-red-500 transition"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Latest Status */}
        {latestCheck && (
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-6 mb-8">
            <h2 className="text-2xl font-semibold text-[#1E293B] mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(latestCheck.status)}`}>
                  {latestCheck.status}
                </div>
                <div className="text-[#64748B] text-sm mt-1">Status</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-[#1E293B]">
                  {latestCheck.response_time}ms
                </div>
                <div className="text-[#64748B] text-sm">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-[#1E293B]">
                  {latestCheck.reigon}
                </div>
                <div className="text-[#64748B] text-sm">Region</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-[#1E293B]">
                  {formatDate(latestCheck.created_at)}
                </div>
                <div className="text-[#64748B] text-sm">Last Check</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {checks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Response Time Chart */}
            <div className="bg-white rounded-xl border border-[#DBE6E1] p-6">
              <h3 className="text-xl font-semibold text-[#1E293B] mb-4">Response Time Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#319795" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#319795" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#64748B' }}
                    />
                    <Tooltip content={<ResponseTimeTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#319795" 
                      strokeWidth={2}
                      fill="url(#responseTimeGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Uptime Status Chart */}
            <div className="bg-white rounded-xl border border-[#DBE6E1] p-6">
              <h3 className="text-xl font-semibold text-[#1E293B] mb-4">Uptime Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      domain={[0, 1]}
                      ticks={[0, 1]}
                      tickFormatter={(value) => value === 1 ? 'UP' : 'DOWN'}
                    />
                    <Tooltip content={<StatusTooltip />} />
                    <Bar 
                      dataKey="status" 
                      fill="#319795"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Status Distribution Summary */}
        {checks.length > 0 && (
          <div className="bg-white rounded-xl border border-[#DBE6E1] p-6 mb-8">
            <h3 className="text-xl font-semibold text-[#1E293B] mb-4">Status Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-[#F0FDF4] rounded-lg">
                <div className="text-3xl font-bold text-green-600">{statusDistribution.up}</div>
                <div className="text-sm text-green-700">Successful Checks</div>
              </div>
              <div className="text-center p-4 bg-[#FEF2F2] rounded-lg">
                <div className="text-3xl font-bold text-red-600">{statusDistribution.down}</div>
                <div className="text-sm text-red-700">Failed Checks</div>
              </div>
              <div className="text-center p-4 bg-[#F8FAFC] rounded-lg border border-[#DBE6E1]">
                <div className="text-3xl font-bold text-[#1E293B]">{statusDistribution.total}</div>
                <div className="text-sm text-[#64748B]">Total Checks</div>
              </div>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-600">Uptime: {((statusDistribution.up / statusDistribution.total) * 100).toFixed(1)}%</span>
                <span className="text-red-600">Downtime: {((statusDistribution.down / statusDistribution.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-4 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(statusDistribution.up / statusDistribution.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Time Filter */}
        <div className="bg-white rounded-xl border border-[#DBE6E1] p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-[#1E293B]">Monitoring History</h2>
            <div className="flex gap-2">
              {timeFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTimeFilter(filter.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    timeFilter === filter.key
                      ? 'bg-[#319795] text-white'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E6FFFA]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checks List */}
          <div className="space-y-3">
            {checks.length === 0 ? (
              <div className="text-center py-12 text-[#64748B]">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No monitoring data available for the selected time period.</p>
                <p className="text-sm mt-2">Start monitoring to see data here.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {checks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#DBE6E1]">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${check.status === 'UP' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium text-[#1E293B]">
                          {formatDate(check.created_at)}
                        </div>
                        <div className="text-sm text-[#64748B]">
                          {check.reigon} • {check.response_time}ms
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(check.status)}`}>
                      {check.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Monitoring Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-[#1E293B] mb-4">Start Monitoring</h3>
            <p className="text-[#64748B] mb-6">
              Start monitoring <strong>{websitename}</strong> from the selected region.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1E293B] mb-2">
                Select Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full p-3 border border-[#DBE6E1] rounded-lg focus:ring-2 focus:ring-[#319795] focus:border-transparent"
              >
                {regions.map((region) => (
                  <option key={region.key} value={region.key}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startMonitoring}
                disabled={actionLoading}
                className="flex-1 bg-[#319795] hover:bg-[#2C7A7B] disabled:bg-[#319795]/50 text-white py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center"
              >
                {actionLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Start Monitoring"
                )}
              </button>
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 bg-[#F8FAFC] hover:bg-[#E6FFFA] text-[#64748B] py-3 px-4 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-[#1E293B] mb-4">Delete All Monitoring Data</h3>
            <p className="text-[#64748B] mb-6">
              Are you sure you want to delete all monitoring data for <strong>{websitename}</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={deleteAllChecks}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center"
              >
                {actionLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Delete All Data"
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-[#F8FAFC] hover:bg-[#E6FFFA] text-[#64748B] py-3 px-4 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
