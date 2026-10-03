import React, { useState, useEffect } from 'react';
import {
  Skull,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { mortalityService } from '../../services/mortality.service';
import { farmService } from '../../services/farm.service';
import { reportService } from '../../services/report.service';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminMortalityPage = () => {
  const [records, setRecords] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [farmId, setFarmId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit / Delete Modal state
  const [editModal, setEditModal] = useState({ open: false, record: null, count: 0, reason: '', remarks: '' });
  const [deleteId, setDeleteId] = useState(null);

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [recData, farmsData] = await Promise.all([
        mortalityService.getMortalities({
          farm_id: farmId || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          search: search || undefined,
        }),
        farmService.getFarms(),
      ]);
      setRecords(recData);
      setFarms(farmsData);
    } catch (err) {
      toastError('Failed to load mortality records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [farmId, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleDownloadPdf = async () => {
    try {
      await reportService.downloadMortalityPdf({
        farm_id: farmId || undefined,
        date_from: startDate || undefined,
        date_to: endDate || undefined,
      });
      success('Mortality PDF Report downloaded.');
    } catch (err) {
      toastError('Failed to generate PDF report.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editModal.record) return;
    try {
      await mortalityService.updateMortality(editModal.record.id, {
        mortality_count: Number(editModal.count),
        reason: editModal.reason,
        remarks: editModal.remarks,
      });
      success('Mortality record updated successfully.');
      setEditModal({ open: false, record: null, count: 0, reason: '', remarks: '' });
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update record.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mortality record?')) return;
    try {
      await mortalityService.deleteMortality(id);
      success('Mortality record deleted.');
      loadData();
    } catch (err) {
      toastError('Failed to delete mortality record.');
    }
  };

  const totalMortalitySum = records.reduce((acc, r) => acc + r.mortality_count, 0);

  return (
    <div className="space-y-6">
      {/* Header with Export & Print controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mortality Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official daily mortality logs across all poultry farms and shades.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto no-print">
          <button
            onClick={handleDownloadPdf}
            className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (hidden on print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reason, batch, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="">All Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <b>{records.length}</b> records
          </span>
          <span>
            Total Loss in View: <b className="text-rose-600 font-extrabold">{totalMortalitySum.toLocaleString()}</b> birds
          </span>
        </div>
      </div>

      {/* Mortality Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Querying mortality logs..." />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Skull className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Mortality Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting the filter criteria or date range.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print-page">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Farm</th>
                  <th className="px-5 py-3.5">Shade</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5 text-center">Mortality</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Remarks</th>
                  <th className="px-5 py-3.5">Manager</th>
                  <th className="px-5 py-3.5 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-900">
                      {new Date(r.mortality_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{r.farm_name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{r.shade_name}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">{r.batch_number}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                        {r.mortality_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">{r.reason}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{r.remarks || '-'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{r.manager_name}</td>
                    <td className="px-5 py-3.5 text-right no-print">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setEditModal({
                              open: true,
                              record: r,
                              count: r.mortality_count,
                              reason: r.reason,
                              remarks: r.remarks || '',
                            })
                          }
                          className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Mortality Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit Mortality Record</h3>
              <button
                onClick={() => setEditModal({ open: false, record: null, count: 0, reason: '', remarks: '' })}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mortality Count *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editModal.count}
                  onChange={(e) => setEditModal({ ...editModal, count: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason *</label>
                <select
                  value={editModal.reason}
                  onChange={(e) => setEditModal({ ...editModal, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Disease">Disease</option>
                  <option value="Heat Stress">Heat Stress</option>
                  <option value="Suffocation">Suffocation</option>
                  <option value="Cannibalism">Cannibalism</option>
                  <option value="Sudden Death">Sudden Death</option>
                  <option value="Predator">Predator</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows="3"
                  value={editModal.remarks}
                  onChange={(e) => setEditModal({ ...editModal, remarks: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, record: null, count: 0, reason: '', remarks: '' })}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMortalityPage;
