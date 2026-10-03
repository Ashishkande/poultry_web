import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Layers,
  PlusCircle,
  Skull,
  FileText,
  Users,
  ShieldCheck,
  History,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/common/NotificationDropdown';
import Badge from '../components/common/Badge';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNavItems = [
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Managers & Requests', to: '/admin/managers', icon: Users },
    { label: 'All Farms', to: '/admin/farms', icon: Building2 },
    { label: 'Batches', to: '/admin/batches', icon: Layers },
    { label: 'Mortality Records', to: '/admin/mortality', icon: Skull },
    { label: 'Reports & PDF', to: '/admin/reports', icon: FileText },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: History },
  ];

  const managerNavItems = [
    { label: 'Dashboard', to: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Add Daily Mortality', to: '/manager/mortality/add', icon: PlusCircle, highlight: true },
    { label: 'My Farms', to: '/manager/farms', icon: Building2 },
    { label: 'Batches', to: '/manager/batches', icon: Layers },
    { label: 'Mortality History', to: '/manager/mortality', icon: Skull },
    { label: 'Reports & PDF', to: '/manager/reports', icon: FileText },
    { label: 'My Profile', to: '/manager/profile', icon: User },
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : managerNavItems;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-72 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } no-print`}
      >
        <div>
          {/* Logo & Branding */}
          <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-black text-xl">
                🐓
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight block">PoultryPro</span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block">
                  Mortality Control
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {user?.role === 'ADMIN' ? 'Administrator Panel' : 'Farm Management'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                        : item.highlight
                        ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-emerald-400' : ''}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-18 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-slate-500 font-medium">Poultry Farm Mortality Management System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role indicator badge */}
            <Badge status={user?.role} text={user?.role} />

            {/* Notification Bell */}
            <NotificationDropdown />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-300">
                  {user?.name?.[0] || 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  {user?.role === 'MANAGER' && (
                    <NavLink
                      to="/manager/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-3.5 h-3.5" />
                      Profile Settings
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
