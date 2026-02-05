import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut } from 'lucide-react';
import Button from './Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-emerald-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-gray-900">
            <span className="h-9 w-9 rounded-[14px] bg-[#22C55E]/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#22C55E]" />
            </span>
            <span>WatchTower</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                to="/websites"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Websites
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link to="/signup">
                <Button className="px-5 py-2 text-xs">Start Monitoring</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
