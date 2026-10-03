import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Skull,
  Calendar,
  Building2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { farmService } from '../../services/farm.service';
import { shadeService } from '../../services/shade.service';
import { batchService } from '../../services/batch.service';
import { mortalityService } from '../../services/mortality.service';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AddMortalityPage = () => {
  const [farms, setFarms] = useState([]);
  const [shades, setShades] = useState([]);
  const [batches, setBatches] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    mortality_date: new Date().toISOString().slice(0, 10),
    farm_id: '',
    shade_id: '',
    batch_id: '',
    mortality_count: '',
    reason: 'Disease',
    remarks: '',
  });

  const [selectedBatchData, setSelectedBatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, message: '', details: null });

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    setLoading(true);
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0) {
        const firstFarmId = data[0].id;
        setFormData((prev) => ({ ...prev, farm_id: firstFarmId }));
        await loadShades(firstFarmId);
      }
    } catch (err) {
      toastError('Failed to load your assigned farms.');
    } finally {
      setLoading(false);
    }
  };

  const loadShades = async (farmId) => {
    if (!farmId) {
      setShades([]);
      return;
    }
    try {
      const data = await shadeService.getShadesForFarm(farmId);
      setShades(data);
      if (data.length > 0) {
        const firstShadeId = data[0].id;
        setFormData((prev) => ({ ...prev, shade_id: firstShadeId }));
        await loadBatches(farmId, firstShadeId);
      } else {
        setShades([]);
        setBatches([]);
        setSelectedBatchData(null);
      }
    } catch (err) {
      setShades([]);
    }
  };

  const loadBatches = async (farmId, shadeId) => {
    if (!farmId || !shadeId) {
      setBatches([]);
      setSelectedBatchData(null);
      return;
    }
    try {
      const data = await batchService.getBatches({
        farm_id: farmId,
        shade_id: shadeId,
        status: 'ACTIVE',
      });
      setBatches(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, batch_id: data[0].id }));
        setSelectedBatchData(data[0]);
      } else {
        setSelectedBatchData(null);
        setFormData((prev) => ({ ...prev, batch_id: '' }));
      }
    } catch (err) {
      setBatches([]);
      setSelectedBatchData(null);
    }
  };

  const handleFarmChange = async (e) => {
    const fId = Number(e.target.value);
    setFormData((prev) => ({ ...prev, farm_id: fId, shade_id: '', batch_id: '' }));
    await loadShades(fId);
  };

  const handleShadeChange = async (e) => {
    const sId = Number(e.target.value);
    setFormData((prev) => ({ ...prev, shade_id: sId, batch_id: '' }));
    await loadBatches(formData.farm_id, sId);
  };

  const handleBatchChange = (e) => {
    const bId = Number(e.target.value);
    setFormData((prev) => ({ ...prev, batch_id: bId }));
    const b = batches.find((item) => item.id === bId);
    setSelectedBatchData(b || null);
  };

  // Validation & Dynamic Calculations
  const enteredCount = Number(formData.mortality_count) || 0;
  const currentBirds = selectedBatchData?.current_birds || 0;
  const initialBirds = selectedBatchData?.initial_birds || 0;
  const totalMortSoFar = selectedBatchData?.total_mortality || 0;

  const isExceeding = enteredCount > currentBirds;
  const isInvalidZero = enteredCount <= 0 && formData.mortality_count !== '';

  const newCurrentBirds = Math.max(0, currentBirds - enteredCount);
  const newTotalMortality = totalMortSoFar + enteredCount;
  const newMortalityPercentage =
    initialBirds > 0 ? ((newTotalMortality / initialBirds) * 100).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.farm_id || !formData.shade_id || !formData.batch_id) {
      toastError('Please select farm, shade, and active batch.');
      return;
    }

    if (enteredCount <= 0) {
      toastError('Mortality count must be greater than zero.');
      return;
    }

    if (isExceeding) {
      toastError('Mortality count cannot exceed the current number of birds.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mortalityService.addMortality({
        farm_id: Number(formData.farm_id),
        shade_id: Number(formData.shade_id),
        batch_id: Number(formData.batch_id),
        mortality_date: formData.mortality_date,
        mortality_count: enteredCount,
        reason: formData.reason,
        remarks: formData.remarks,
      });

      const shadeObj = shades.find((s) => s.id === Number(formData.shade_id));
      const shadeName = shadeObj ? shadeObj.name : 'selected shade';

      setSuccessModal({
        open: true,
        message: `Mortality added successfully. ${enteredCount} mortality records added for ${shadeName}.`,
        details: res.record,
      });

      toastSuccess(`Mortality added successfully. ${enteredCount} mortality records added for ${shadeName}.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit mortality record.';
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    setSuccessModal({ open: false, message: '', details: null });
    navigate('/manager/mortality');
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading assigned farm configuration..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Add Daily Mortality</h1>
        <p className="text-sm text-slate-500 mt-1">
          Record daily flock mortality for your assigned farm, shade, and active poultry batch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date and Farm Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mortality Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.mortality_date}
                  onChange={(e) => setFormData({ ...formData, mortality_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned Farm *</span>
                </label>
                <select
                  required
                  value={formData.farm_id}
                  onChange={handleFarmChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 font-medium"
                >
                  {farms.length === 0 && <option value="">No Assigned Farms</option>}
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shade and Batch Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Farm Shade *</span>
                </label>
                <select
                  required
                  value={formData.shade_id}
                  onChange={handleShadeChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 font-medium"
                >
                  {shades.length === 0 && <option value="">No Shades Available</option>}
                  {shades.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shade_number} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active Poultry Batch *</span>
                </label>
                <select
                  required
                  value={formData.batch_id}
                  onChange={handleBatchChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 font-mono font-medium"
                >
                  {batches.length === 0 && <option value="">No Active Batches in this Shade</option>}
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} ({b.breed})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mortality Count Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <Skull className="w-4 h-4" />
                  <span>Number of Birds Dead (Mortality Count) *</span>
                </span>
                {selectedBatchData && (
                  <span className="text-[11px] text-slate-500 font-normal">
                    Available living birds: <strong className="text-emerald-700">{currentBirds.toLocaleString()}</strong>
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max={currentBirds}
                  placeholder="Enter count (e.g. 15)"
                  value={formData.mortality_count}
                  onChange={(e) => setFormData({ ...formData, mortality_count: e.target.value })}
                  className={`w-full p-3 rounded-xl border text-base font-extrabold focus:outline-none transition-all ${
                    isExceeding
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 text-slate-900'
                  }`}
                />
              </div>

              {/* Dynamic Validation Warning */}
              {isExceeding && (
                <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Validation Error:</strong> Mortality count ({enteredCount}) cannot exceed the current number of birds ({currentBirds}).
                  </span>
                </div>
              )}
            </div>

            {/* Reason Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Reason / Diagnosis *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 font-medium"
              >
                <option value="Disease">Disease (Bacterial / Viral / Fungal)</option>
                <option value="Heat Stress">Heat Stress / High Temperature</option>
                <option value="Suffocation">Suffocation / Ventilation Failure</option>
                <option value="Cannibalism">Cannibalism / Aggression</option>
                <option value="Sudden Death">Sudden Death Syndrome (Heart Attack)</option>
                <option value="Predator">Predator Intrusion</option>
                <option value="Unknown">Unknown Cause (Post-mortem pending)</option>
                <option value="Other">Other Causes</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Remarks & Observations
              </label>
              <textarea
                rows="3"
                placeholder="Observed abnormal symptoms in the morning inspection, medication administered, etc."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || isExceeding || isInvalidZero || !selectedBatchData}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span>Recording Mortality...</span>
                ) : (
                  <>
                    <Skull className="w-4 h-4" />
                    <span>Submit Daily Mortality</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Calculation & Preview Card Column */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg shadow-slate-950/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span>Live Batch Calculation</span>
            </h3>

            {selectedBatchData ? (
              <div className="space-y-4 text-xs">
                <div className="pb-3 border-b border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Batch</span>
                  <span className="font-mono font-bold text-sm text-white">{selectedBatchData.batch_number}</span>
                  <span className="text-slate-400 block text-[11px] mt-0.5">{selectedBatchData.breed}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Initial Birds:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {initialBirds.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Living Birds:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {currentBirds.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Entered Today:</span>
                  <span className="font-mono font-bold text-rose-400">
                    - {enteredCount.toLocaleString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">New Living Birds:</span>
                    <span className="font-mono font-extrabold text-base text-white">
                      {newCurrentBirds.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-400">New Mortality %:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {newMortalityPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                Select an active batch to see real-time bird balance calculations.
              </div>
            )}
          </div>

          {/* Validation Notice Card */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Mortality Rules</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 pl-1">
              <li>Entry immediately alerts the system administrator.</li>
              <li>Batch current birds will auto-decrement upon save.</li>
              <li>Duplicate entries on the same date are rejected.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Modal matching Section 8 Specification */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Mortality Added Successfully
            </h3>

            <p className="text-sm font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 my-4">
              {successModal.message}
            </p>

            {successModal.details && (
              <div className="text-left text-xs bg-slate-50 p-4 rounded-xl space-y-1.5 mb-6 text-slate-600 border border-slate-100">
                <p><b>Farm:</b> {successModal.details.farm_name}</p>
                <p><b>Shade:</b> {successModal.details.shade_name}</p>
                <p><b>Batch:</b> {successModal.details.batch_number}</p>
                <p><b>Reason:</b> {successModal.details.reason}</p>
                <p><b>Admin Notification:</b> Sent immediately 🔔</p>
              </div>
            )}

            <button
              onClick={handleFinishSuccess}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View In Mortality History</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMortalityPage;
