import { Link } from 'react-router-dom';
import Button from '../components/Button';
import MetricCard from '../components/MetricCard';
import Container from '../components/Container';

const Home = () => {
  const uptimeData = [98, 99, 99.5, 99.1, 99.6, 99.98];
  const responseData = [320, 420, 280, 520, 460, 450];
  const errorData = [2.2, 3.1, 4.8, 3.5, 5.2, 4.6];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <Container className="py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22C55E]/10 text-[#16A34A] text-sm font-semibold">
            WatchTower SaaS Monitoring
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mt-6">
            Monitor Your Website. Stay Ahead of Downtime.
          </h1>
          <p className="text-lg text-gray-600 mt-5 max-w-2xl mx-auto">
            Track uptime, response time, and errors in real-time. Get instant alerts before users notice a problem.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button className="px-8 py-4 text-base">Start Monitoring</Button>
            </Link>
            <Button variant="outline" className="px-8 py-4 text-base">
              Contact Us
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Uptime"
            value="99.98%"
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
      </Container>
    </div>
  );
};

export default Home;
