import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import AuthCard from '../components/AuthCard';

const strengthMap = [
  { label: 'Weak', color: 'bg-red-400' },
  { label: 'Fair', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-emerald-400' },
  { label: 'Strong', color: 'bg-[#22C55E]' },
];

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accepted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => {
    const score = [
      form.password.length >= 8,
      /[A-Z]/.test(form.password),
      /[0-9]/.test(form.password),
      /[^A-Za-z0-9]/.test(form.password),
    ].filter(Boolean).length;
    return strengthMap[Math.min(score, strengthMap.length - 1)];
  }, [form.password]);

  const handleChange = (key) => (event) => {
    const value = key === 'accepted' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.accepted) {
      setError('Please accept the terms and privacy policy.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-4 py-12">
      <AuthCard
        title="Create your account"
        subtitle="Start monitoring with WatchTower"
        footer={
          <span>
            Already have an account?{' '}
            <Link to="/login" className="text-[#16A34A] font-semibold hover:text-[#15803D]">
              Login
            </Link>
          </span>
        }
      >
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-[16px] text-sm mb-4">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              className="mt-2 w-full rounded-[16px] border border-gray-200 px-4 py-3 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              placeholder="Alex Morgan"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="mt-2 w-full rounded-[16px] border border-gray-200 px-4 py-3 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              placeholder="alex@watchtower.io"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              className="mt-2 w-full rounded-[16px] border border-gray-200 px-4 py-3 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              placeholder="Create a strong password"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className="mt-2 w-full rounded-[16px] border border-gray-200 px-4 py-3 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              placeholder="Repeat password"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Password strength</span>
              <span className="font-medium text-gray-700">{strength.label}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full ${strength.color}`}
                style={{ width: `${Math.min((form.password.length / 12) * 100, 100)}%` }}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.accepted}
              onChange={handleChange('accepted')}
              className="h-4 w-4 rounded border-gray-300 text-[#22C55E] focus:ring-[#22C55E]/40"
            />
            I agree to the Terms & Privacy Policy
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
};

export default Signup;
