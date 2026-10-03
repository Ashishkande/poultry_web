import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      toastSuccess(`Welcome back, ${data.user.name}!`);

      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/manager/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toastError(msg);

      if (msg.includes('verify your email')) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else if (msg.includes('pending administrator approval')) {
        navigate('/pending-approval');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Brand Hero */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl shadow-inner">
                🐓
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">PoultryPro</h2>
                <p className="text-xs text-emerald-300 font-medium tracking-wide uppercase">Farm Mortality Suite</p>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Enterprise Poultry & Mortality Management
            </h1>
            <p className="text-emerald-100/80 text-sm mt-3 leading-relaxed">
              Real-time mortality tracking, shade environmental oversight, batch analytics, and certified PDF audit reports.
            </p>
          </div>

          {/* Production Notice */}
          <div className="mt-8 pt-6 border-t border-emerald-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Production Portal</span>
            </div>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              PostgreSQL secured database. Farm managers register via the link on the right, verify email OTP, and receive administrator authorization.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your credentials to access the mortality dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@poultryfarm.com"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New Farm Manager?{' '}
              <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-800">
                Register account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
