import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { checksService } from '../services/checksService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const WebsiteDetail = () => {
  const { websitename } = useParams();
  const [uptime, setUptime] = useState(null);
  const [checks, setChecks] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [region, setRegion] = useState('US_EAST_1');

  useEffect(() => {
    fetchData();
  }, [websitename, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uptimeData, checksData] = await Promise.all([
        checksService.getUptime(websitename),
        getChecksByTimeRange(),
      ]);
      setUptime(uptimeData);
      setChecks(checksData.checks || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChecksByTimeRange = async () => {
    switch (timeRange) {
      case '1h':
        return await checksService.getLast1Hour(websitename);
      case '24h':
        return await checksService.getLast24Hours(websitename);
      case '7d':
        return await checksService.getLast7Days(websitename);
      case '30d':
        return await checksService.getLast30Days(websitename);
      default:
        return await checksService.getLast24Hours(websitename);
    }
  };

  const handleAddCheck = async () => {
    try {
      await checksService.addCheck({ websitename, reigon: region });
      setShowAddCheck(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add check:', err);
    }
  };

  const formatChartData = () => {
    return checks.map((check, index) => ({
      name: `#${index + 1}`,
      responseTime: check.response_time || 0,
      status: check.status === 'UP' ? 1 : 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{websitename}</h1>
              <p className="text-gray-600">Website Monitoring Dashboard</p>
            </div>
            <button
              onClick={() => setShowAddCheck(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Start Monitoring
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        {uptime && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Uptime</p>
                  <p className="text-3xl font-bold text-green-600">
                    {uptime.uptimePercentage?.toFixed(2)}%
                  </p>
                </div>
                <Activity className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Avg Response Time</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {uptime.averageResponseTime?.toFixed(0)}ms
                  </p>
                </div>
                <Clock className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Error Rate</p>
                  <p className="text-3xl font-bold text-red-600">
                    {uptime.errorMetric?.toFixed(2)}%
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Time Range Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Response Time History</h2>
            <div className="flex space-x-2">
              {['1h', '24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg transition ${
                    timeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {checks.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No data available for this time range
            </div>
          )}
        </div>

        {/* Recent Checks */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Checks</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {checks.slice(0, 10).map((check, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          check.status === 'UP'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {check.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.response_time || 0}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {check.reigon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(check.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Check Modal */}
        {showAddCheck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Start Monitoring</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="US_EAST_1">US East 1</option>
                    <option value="US_WEST_1">US West 1</option>
                    <option value="EU_WEST_1">EU West 1</option>
                    <option value="AP_SOUTHEAST_1">Asia Pacific Southeast 1</option>
                  </select>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddCheck(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCheck}
                    className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteDetail;
