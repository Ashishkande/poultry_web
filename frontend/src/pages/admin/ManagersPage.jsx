import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  UserCheck,
  Shield,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';

const ManagersPage = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [allManagers, setAllManagers] = useState([]);
  const [pendingManagers, setPendingManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState({ open: false, manager: null, reason: '' });

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [all, pending] = await Promise.all([
        adminService.getAllManagers(),
        adminService.getPendingManagers(),
      ]);
      setAllManagers(all);
      setPendingManagers(pending);
      // Auto-switch to all if no pending
      if (pending.length === 0 && activeTab === 'pending') {
        setActiveTab('all');
      }
    } catch (err) {
      toastError('Failed to load manager accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id, name) => {
    try {
      await adminService.approveManager(id);
      success(`Manager account for ${name} approved successfully.`);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to approve manager.');
    }
  };

  const handleReject = async () => {
    if (!rejectModal.manager) return;
    try {
      await adminService.rejectManager(rejectModal.manager.id, rejectModal.reason);
      success(`Access request for ${rejectModal.manager.name} rejected.`);
      setRejectModal({ open: false, manager: null, reason: '' });
      loadData();
    } catch (err) {
      toastError('Failed to reject manager request.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'APPROVED' ? false : true;
    try {
      await adminService.toggleManagerStatus(id, newStatus);
      success('Manager status updated.');
      loadData();
    } catch (err) {
      toastError('Failed to update manager status.');
    }
  };

  const filteredManagers = allManagers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manager Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Authorize new access requests and oversee all registered farm managers.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs self-start">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Requests</span>
            {pendingManagers.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'pending' ? 'bg-white text-amber-700 font-extrabold' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingManagers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Managers ({allManagers.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Fetching managers directory..." />
        </div>
      ) : activeTab === 'pending' ? (
        /* Pending Access Requests */
        <div className="space-y-4">
          {pendingManagers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <UserCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Pending Access Requests</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All registered farm managers have been verified and processed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingManagers.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-lg">
                          {m.name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{m.name}</h3>
                          <Badge status="PENDING_ADMIN_APPROVAL" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Registered on {new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(m.id, m.name)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Access
                    </button>
                    <button
                      onClick={() => setRejectModal({ open: true, manager: m, reason: '' })}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* All Managers Directory */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Manager</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Registered</th>
                  <th className="px-6 py-3.5 text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredManagers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {m.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-[11px] text-slate-500">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{m.phone}</td>
                    <td className="px-6 py-4">
                      <Badge status={m.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleToggleStatus(m.id, m.status)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                        >
                          Disable Account
                        </button>
                      ) : m.status === 'DISABLED' ? (
                        <button
                          onClick={() => handleToggleStatus(m.id, m.status)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                        >
                          Enable Account
                        </button>
                      ) : m.status === 'PENDING_ADMIN_APPROVAL' ? (
                        <button
                          onClick={() => handleApprove(m.id, m.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                        >
                          Approve Now
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Access Request</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to reject access for <strong>{rejectModal.manager?.name}</strong>?
            </p>

            <textarea
              rows="3"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Optional explanation / rejection remarks..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRejectModal({ open: false, manager: null, reason: '' })}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagersPage;
