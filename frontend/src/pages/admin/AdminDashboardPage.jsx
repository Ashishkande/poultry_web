import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Layers,
  Activity,
  Skull,
  TrendingDown,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminService } from '../../services/admin.service';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchDashboard(days);
  }, [days]);

  const fetchDashboard = async (selectedDays) => {
    setLoading(true);
    try {
      const res = await adminService.getDashboard(selectedDays);
      setData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading Admin Intelligence Dashboard..." />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const trends = data?.trends || [];
  const farmWise = data?.farm_wise || [];
  const reasonWise = data?.reason_wise || [];
  const recentFeed = data?.recent_feed || [];

  const COLORS = ['#15803d', '#d97706', '#dc2626', '#0284c7', '#7c3aed', '#64748b'];

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time poultry farm mortality tracking and enterprise statistics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              days === 7 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              days === 30 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDays(90)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              days === 90 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Farms"
          value={kpis.total_farms || 0}
          subtitle="All registered agricultural sites"
          icon={Building2}
          variant="slate"
        />
        <StatCard
          title="Total Managers"
          value={kpis.total_managers || 0}
          subtitle={kpis.pending_managers > 0 ? `⚠️ ${kpis.pending_managers} access request pending` : 'All managers active'}
          icon={Users}
          variant={kpis.pending_managers > 0 ? 'amber' : 'blue'}
        />
        <StatCard
          title="Active Batches"
          value={kpis.active_batches || 0}
          subtitle={`Across all farm shades`}
          icon={Layers}
          variant="emerald"
        />
        <StatCard
          title="Total Living Birds"
          value={(kpis.total_birds || 0).toLocaleString()}
          subtitle="Current active flock count"
          icon={Activity}
          variant="emerald"
        />
      </div>

      {/* Mortality Specific Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Mortality"
          value={kpis.today_mortality || 0}
          subtitle="Reported dead today"
          icon={Skull}
          variant="red"
        />
        <StatCard
          title="Total Cumulative Mortality"
          value={(kpis.total_mortality || 0).toLocaleString()}
          subtitle="Total losses recorded"
          icon={Skull}
          variant="slate"
        />
        <StatCard
          title="Overall Mortality Rate"
          value={`${kpis.overall_mortality_percentage || 0}%`}
          subtitle="Standard industry tolerance < 4.0%"
          icon={TrendingDown}
          variant={kpis.overall_mortality_percentage > 4.0 ? 'red' : 'amber'}
        />
      </div>

      {/* Mortality Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Mortality Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Daily Mortality Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Flock loss pattern over the selected {days} day period
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              Trend Analysis
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                  itemStyle={{ color: '#4ade80' }}
                  formatter={(val) => [`${val} birds`, 'Mortality']}
                />
                <Line
                  type="monotone"
                  dataKey="mortality"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16a34a' }}
                  activeDot={{ r: 6, fill: '#15803d' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Farm-wise Mortality Comparison */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Farm-wise Mortality
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Comparison across sites</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {farmWise.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No farm mortality recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={farmWise} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis
                      dataKey="farm"
                      type="category"
                      tick={{ fontSize: 10, fill: '#334155' }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(val) => [`${val} birds`, 'Mortality']}
                    />
                    <Bar dataKey="mortality" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Mortality Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Mortality Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time incoming submissions from farm managers</p>
          </div>
          <Link
            to="/admin/mortality"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowUpRight className="w-4 h-4" />
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
                <th className="px-6 py-3.5">Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentFeed.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No mortality recorded recently.
                  </td>
                </tr>
              ) : (
                recentFeed.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900 whitespace-nowrap">{row.date}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{row.farm_name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{row.shade_name}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-semibold text-slate-800">
                        {row.batch_number}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                        {row.count} birds
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-slate-700 font-medium">{row.reason}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{row.manager_name}</td>
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

export default AdminDashboardPage;
