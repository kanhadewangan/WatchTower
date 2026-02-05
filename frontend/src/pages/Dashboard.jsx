import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { websiteService } from '../services/websiteService';
import { checksService } from '../services/checksService';
import MetricCard from '../components/MetricCard';
import Container from '../components/Container';

const Dashboard = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWebsites: 0,
    activeMonitoring: 0,
    avgUptime: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await websiteService.getWebsites();
      const websiteList = data.websites || [];
      setWebsites(websiteList);

      // Calculate stats
      let totalUptime = 0;
      let count = 0;

      for (const website of websiteList) {
        try {
          const uptimeData = await checksService.getUptime(website.name);
          totalUptime += uptimeData.uptimePercentage || 0;
          count++;
        } catch (err) {
          // Skip if no data
        }
      }

      setStats({
        totalWebsites: websiteList.length,
        activeMonitoring: count,
        avgUptime: count > 0 ? totalUptime / count : 0,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const uptimeData = [97, 98.8, 99.2, 98.7, 99.5, 99.8];
  const responseData = [420, 380, 450, 390, 470, 410];
  const errorData = [6.2, 5.5, 4.8, 5.2, 4.1, 3.8];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <Container className="py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#16A34A] uppercase tracking-wide">Dashboard</p>
          <h1 className="text-3xl font-semibold text-gray-900 mt-2">Website Overview</h1>
          <p className="text-gray-600 mt-2">A unified view of uptime, response, and incidents.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <MetricCard
            title="Uptime"
            value={`${stats.avgUptime.toFixed(1)}%`}
            status="UP"
            themeColor="#22C55E"
            chartData={uptimeData}
          />
          <MetricCard
            title="Response Time"
            value="450 ms"
            themeColor="#F59E0B"
            chartData={responseData}
          />
          <MetricCard
            title="Error Rate"
            value="5.2%"
            themeColor="#EF4444"
            chartData={errorData}
            chartType="bar"
          />
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monitored Websites</h2>
            <Link to="/websites" className="text-sm font-semibold text-[#16A34A]">
              View all
            </Link>
          </div>

          {websites.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-14 w-14 rounded-[18px] bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#22C55E] text-xl">+</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">No websites monitored yet</h3>
              <p className="text-sm text-gray-500 mt-2">Add your first website to unlock insights.</p>
              <Link
                to="/websites"
                className="inline-flex mt-6 px-5 py-2 rounded-[16px] bg-[#22C55E] text-white text-sm font-semibold shadow"
              >
                Add Website
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {websites.slice(0, 6).map((website) => (
                <Link
                  key={website.id}
                  to={`/website/${website.name}`}
                  className="border border-emerald-100 rounded-[18px] p-4 hover:border-[#22C55E] hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-800 truncate">{website.name}</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">{website.url}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Dashboard;
