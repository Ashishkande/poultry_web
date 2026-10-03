import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  X,
  TrendingDown,
} from 'lucide-react';
import { batchService } from '../../services/batch.service';
import { farmService } from '../../services/farm.service';
import { shadeService } from '../../services/shade.service';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';

const ManagerBatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Batch Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formFarmsShades, setFormFarmsShades] = useState([]);
  const [newBatch, setNewBatch] = useState({
    farm_id: '',
    shade_id: '',
    batch_number: '',
    breed: '',
    bird_type: 'Broiler',
    initial_birds: '',
    arrival_date: new Date().toISOString().slice(0, 10),
    expected_end_date: '',
    notes: '',
  });

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesData, farmsData] = await Promise.all([
        batchService.getBatches(),
        farmService.getFarms(),
      ]);
      setBatches(batchesData);
      setFarms(farmsData);
    } catch (err) {
      toastError('Failed to load batch records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFarmSelect = async (farmId) => {
    setNewBatch({ ...newBatch, farm_id: farmId, shade_id: '' });
    if (!farmId) {
      setFormFarmsShades([]);
      return;
    }
    try {
      const shades = await shadeService.getShadesForFarm(farmId);
      setFormFarmsShades(shades);
      if (shades.length > 0) {
        setNewBatch((prev) => ({ ...prev, shade_id: shades[0].id }));
      }
    } catch (err) {
      setFormFarmsShades([]);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatch.farm_id || !newBatch.shade_id) {
      toastError('Please select both a farm and a shade.');
      return;
    }

    try {
      await batchService.createBatch(newBatch);
      success(`Batch "${newBatch.batch_number}" created successfully.`);
      setAddModalOpen(false);
      setNewBatch({
        farm_id: '',
        shade_id: '',
        batch_number: '',
        breed: 'Broiler (Cobb 500)',
        bird_type: 'Broiler',
        initial_birds: 5000,
        arrival_date: new Date().toISOString().slice(0, 10),
        expected_end_date: '',
        notes: '',
      });
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create batch.');
    }
  };

  const filteredBatches = batches.filter((b) => {
    return (
      b.batch_number.toLowerCase().includes(search.toLowerCase()) ||
      b.farm_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.breed?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Poultry Batches</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of poultry flocks introduced in your assigned farm shades.
          </p>
        </div>

        <button
          onClick={() => {
            setAddModalOpen(true);
            if (farms.length > 0) handleFarmSelect(farms[0].id);
          }}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Batch</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search batches by batch number, breed, or farm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs focus:outline-none text-slate-800"
        />
      </div>

      {/* Batches Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading batch records..." />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Layers className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Batches Found</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add New Batch" to record an incoming bird flock.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Batch</th>
                  <th className="px-6 py-3.5">Farm & Shade</th>
                  <th className="px-6 py-3.5">Breed / Type</th>
                  <th className="px-6 py-3.5">Living / Initial Birds</th>
                  <th className="px-6 py-3.5">Mortality Rate</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                        {b.batch_number}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">Arrival: {b.arrival_date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{b.farm_name}</p>
                      <p className="text-[11px] text-slate-500">{b.shade_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{b.breed}</p>
                      <span className="text-[10px] text-slate-500 uppercase">{b.bird_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700">{b.current_birds.toLocaleString()}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{b.initial_birds.toLocaleString()}</span>
                      </div>
                      <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (b.current_birds / b.initial_birds) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-extrabold ${
                          b.mortality_percentage > 4.0 ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      >
                        {b.mortality_percentage}%
                      </span>
                      <p className="text-[10px] text-slate-400">({b.total_mortality} dead)</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add New Poultry Batch</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Farm *</label>
                  <select
                    required
                    value={newBatch.farm_id}
                    onChange={(e) => handleFarmSelect(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shade *</label>
                  <select
                    required
                    value={newBatch.shade_id}
                    onChange={(e) => setNewBatch({ ...newBatch, shade_id: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">Select Shade</option>
                    {formFarmsShades.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shade_number} - {s.name} (Cap: {s.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BATCH-2026-004"
                  value={newBatch.batch_number}
                  onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Breed *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cobb 500"
                    value={newBatch.breed}
                    onChange={(e) => setNewBatch({ ...newBatch, breed: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bird Type *</label>
                  <select
                    value={newBatch.bird_type}
                    onChange={(e) => setNewBatch({ ...newBatch, bird_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Broiler">Broiler</option>
                    <option value="Layer">Layer</option>
                    <option value="Breeder">Breeder</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Birds *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBatch.initial_birds}
                    onChange={(e) => setNewBatch({ ...newBatch, initial_birds: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Arrival Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.arrival_date}
                    onChange={(e) => setNewBatch({ ...newBatch, arrival_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows="2"
                  placeholder="Additional remarks..."
                  value={newBatch.notes}
                  onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBatchesPage;
