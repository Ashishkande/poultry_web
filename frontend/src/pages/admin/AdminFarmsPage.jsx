import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Layers,
  Users,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { farmService } from '../../services/farm.service';
import { shadeService } from '../../services/shade.service';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';

const AdminFarmsPage = () => {
  const [farms, setFarms] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [addFarmOpen, setAddFarmOpen] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: '',
    code: '',
    location: '',
    address: '',
    contact_number: '',
    manager_ids: [],
    initial_shades: 3,
  });

  const [shadesModal, setShadesModal] = useState({ open: false, farm: null, shades: [], loading: false });
  const [newShade, setNewShade] = useState({ shade_number: '', name: '', capacity: 5000 });

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [farmsData, managersData] = await Promise.all([
        farmService.getFarms(),
        adminService.getAllManagers(),
      ]);
      setFarms(farmsData);
      setManagers(managersData.filter((m) => m.status === 'APPROVED'));
    } catch (err) {
      toastError('Failed to load farms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    try {
      const createdFarm = await farmService.createFarm(newFarm);

      // Auto create initial shades if specified
      if (newFarm.initial_shades > 0) {
        for (let i = 1; i <= Number(newFarm.initial_shades); i++) {
          await shadeService.createShade(createdFarm.id, {
            shade_number: `SHADE-${i < 10 ? '0' : ''}${i}`,
            name: `Shade ${i < 10 ? '0' : ''}${i}`,
            capacity: 5000,
          });
        }
      }

      success(`Farm "${newFarm.name}" created successfully with ${newFarm.initial_shades} shades.`);
      setAddFarmOpen(false);
      setNewFarm({
        name: '',
        code: '',
        location: '',
        address: '',
        contact_number: '',
        manager_ids: [],
        initial_shades: 3,
      });
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create farm.');
    }
  };

  const handleOpenShades = async (farm) => {
    setShadesModal({ open: true, farm, shades: [], loading: true });
    try {
      const shades = await shadeService.getShadesForFarm(farm.id);
      setShadesModal({ open: true, farm, shades, loading: false });
    } catch (err) {
      toastError('Failed to load shades.');
      setShadesModal({ open: false, farm: null, shades: [], loading: false });
    }
  };

  const handleCreateShade = async (e) => {
    e.preventDefault();
    if (!shadesModal.farm) return;
    try {
      await shadeService.createShade(shadesModal.farm.id, newShade);
      success(`Shade "${newShade.name}" added successfully.`);
      const updatedShades = await shadeService.getShadesForFarm(shadesModal.farm.id);
      setShadesModal((prev) => ({ ...prev, shades: updatedShades }));
      setNewShade({ shade_number: '', name: '', capacity: 5000 });
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add shade.');
    }
  };

  const filteredFarms = farms.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Poultry Farms</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage agricultural farm facilities, shade architecture, and assigned managers.
          </p>
        </div>

        <button
          onClick={() => setAddFarmOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by farm name, code, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs focus:outline-none text-slate-800"
        />
      </div>

      {/* Farms Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading farm facilities..." />
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Farms Found</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add New Farm" to register a poultry farm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {farm.code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg mt-1 tracking-tight">
                      {farm.name}
                    </h3>
                  </div>
                  <Badge status={farm.status} />
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{farm.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{farm.contact_number}</span>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Shades</span>
                    <span className="text-base font-black text-slate-800">{farm.shades_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Batches</span>
                    <span className="text-base font-black text-slate-800">{farm.batches_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Birds</span>
                    <span className="text-base font-black text-emerald-700">
                      {farm.total_birds.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Assigned Managers */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Assigned Managers:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {farm.managers && farm.managers.length > 0 ? (
                      farm.managers.map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          👤 {m.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">None assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenShades(farm)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manage Shades ({farm.shades_count})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Farm Modal */}
      {addFarmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add New Poultry Farm</h3>
              <button
                onClick={() => setAddFarmOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green Valley Farm"
                    value={newFarm.name}
                    onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GVP001"
                    value={newFarm.code}
                    onChange={(e) => setNewFarm({ ...newFarm, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune Rural"
                    value={newFarm.location}
                    onChange={(e) => setNewFarm({ ...newFarm, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98000 00000"
                    value={newFarm.contact_number}
                    onChange={(e) => setNewFarm({ ...newFarm, contact_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Full physical address..."
                  value={newFarm.address}
                  onChange={(e) => setNewFarm({ ...newFarm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auto-Generate Shades
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newFarm.initial_shades}
                    onChange={(e) => setNewFarm({ ...newFarm, initial_shades: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Manager
                  </label>
                  <select
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setNewFarm({ ...newFarm, manager_ids: id ? [id] : [] });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">Select Manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddFarmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  Create Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shade Management Modal */}
      {shadesModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {shadesModal.farm?.name} — Shades
                </h3>
                <p className="text-xs text-slate-500">
                  Manage individual housing chambers and capacities.
                </p>
              </div>
              <button
                onClick={() => setShadesModal({ open: false, farm: null, shades: [], loading: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shades List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {shadesModal.loading ? (
                <LoadingSpinner message="Loading shades..." />
              ) : shadesModal.shades.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No shades created yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shadesModal.shades.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {s.shade_number}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 truncate">
                            {s.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Capacity: <b>{s.capacity.toLocaleString()}</b> birds
                        </p>
                      </div>
                      <Badge status={s.status} size="xs" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Shade Form */}
            <div className="pt-4 border-t border-slate-100 bg-white">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Add New Shade to Farm</h4>
              <form onSubmit={handleCreateShade} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Shade No. (e.g. SHADE-04)"
                  value={newShade.shade_number}
                  onChange={(e) => setNewShade({ ...newShade, shade_number: e.target.value })}
                  className="p-2 rounded-xl border border-slate-200 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Name (e.g. South Wing)"
                  value={newShade.name}
                  onChange={(e) => setNewShade({ ...newShade, name: e.target.value })}
                  className="p-2 rounded-xl border border-slate-200 text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="Capacity"
                    value={newShade.capacity}
                    onChange={(e) => setNewShade({ ...newShade, capacity: Number(e.target.value) })}
                    className="p-2 rounded-xl border border-slate-200 text-xs w-full"
                  />
                  <button
                    type="submit"
                    className="px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFarmsPage;
