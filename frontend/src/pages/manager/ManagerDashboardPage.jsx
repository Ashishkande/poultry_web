import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Layers,
  Activity,
  Skull,
  TrendingDown,
  PlusCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const ManagerDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/managers/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading Farm Manager Dashboard..." />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recentFeed = data?.recent_feed || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg shadow-emerald-950/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Farm Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
            You are managing <b>{kpis.my_farms || 0} farms</b> with <b>{kpis.active_batches || 0} active batches</b>. Remember to log your daily mortalities promptly.
          </p>
        </div>

        <Link
          to="/manager/mortality/add"
          className="self-start sm:self-auto py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add Daily Mortality</span>
        </Link>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="My Assigned Farms"
          value={kpis.my_farms || 0}
          subtitle="Sites under your management"
          icon={Building2}
          variant="slate"
        />
        <StatCard
          title="Active Batches"
          value={kpis.active_batches || 0}
          subtitle="Batches in production"
          icon={Layers}
          variant="emerald"
        />
        <StatCard
          title="Total Living Birds"
          value={(kpis.total_birds || 0).toLocaleString()}
          subtitle="Remaining active flock"
          icon={Activity}
          variant="emerald"
        />
        <StatCard
          title="Today's Mortality"
          value={kpis.today_mortality || 0}
          subtitle="Birds lost today"
          icon={Skull}
          variant="red"
        />
        <StatCard
          title="Total Cumulative Mortality"
          value={(kpis.total_mortality || 0).toLocaleString()}
          subtitle="Across all your batches"
          icon={Skull}
          variant="slate"
        />
        <StatCard
          title="Mortality Rate"
          value={`${kpis.mortality_percentage || 0}%`}
          subtitle="Cumulative flock loss rate"
          icon={TrendingDown}
          variant={kpis.mortality_percentage > 4.0 ? 'red' : 'amber'}
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/manager/mortality/add"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Add Mortality</h4>
                <p className="text-xs text-slate-500">Record daily flock losses</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/manager/farms"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">My Farms</h4>
                <p className="text-xs text-slate-500">View facilities & shades</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/manager/batches"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">View Batches</h4>
                <p className="text-xs text-slate-500">Flock batches & bird counts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/manager/reports"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">View Reports</h4>
                <p className="text-xs text-slate-500">Generate & download PDF</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Recent Mortality Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Entries recorded by you for your assigned farms</p>
          </div>
          <Link
            to="/manager/mortality"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Farm</th>
                <th className="px-6 py-3.5">Shade</th>
                <th className="px-6 py-3.5">Batch</th>
                <th className="px-6 py-3.5">Mortality</th>
                <th className="px-6 py-3.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentFeed.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No mortality records submitted yet. Click "+ Add Daily Mortality" above.
                  </td>
                </tr>
              ) : (
                recentFeed.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{row.date}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{row.farm_name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{row.shade_name}</td>
                    <td className="px-6 py-3.5 font-mono font-semibold text-slate-800">{row.batch_number}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                        {row.count} birds
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">{row.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;
