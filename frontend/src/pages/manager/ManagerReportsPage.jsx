import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  Layers,
  Filter,
} from 'lucide-react';
import { farmService } from '../../services/farm.service';
import { shadeService } from '../../services/shade.service';
import { batchService } from '../../services/batch.service';
import { reportService } from '../../services/report.service';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ManagerReportsPage = () => {
  const [farms, setFarms] = useState([]);
  const [shades, setShades] = useState([]);
  const [batches, setBatches] = useState([]);

  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedShade, setSelectedShade] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarm(data[0].id);
        loadShades(data[0].id);
        loadBatches(data[0].id);
      }
    } catch (err) {
      toastError('Failed to load farms.');
    }
  };

  const loadShades = async (fId) => {
    if (!fId) {
      setShades([]);
      return;
    }
    try {
      const data = await shadeService.getShadesForFarm(fId);
      setShades(data);
    } catch (err) {
      setShades([]);
    }
  };

  const loadBatches = async (fId, sId = null) => {
    if (!fId) {
      setBatches([]);
      return;
    }
    try {
      const data = await batchService.getBatches({
        farm_id: fId,
        shade_id: sId || undefined,
      });
      setBatches(data);
    } catch (err) {
      setBatches([]);
    }
  };

  const handleFarmChange = (fId) => {
    setSelectedFarm(fId);
    setSelectedShade('');
    setSelectedBatch('');
    loadShades(fId);
    loadBatches(fId);
  };

  const handleShadeChange = (sId) => {
    setSelectedShade(sId);
    setSelectedBatch('');
    loadBatches(selectedFarm, sId);
  };

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await reportService.getMortalityReport({
        farm_id: selectedFarm || undefined,
        shade_id: selectedShade || undefined,
        batch_id: selectedBatch || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setReportData(data);
      success('Report generated successfully.');
    } catch (err) {
      toastError('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await reportService.downloadMortalityPdf({
        farm_id: selectedFarm || undefined,
        shade_id: selectedShade || undefined,
        batch_id: selectedBatch || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      success('PDF report downloaded successfully.');
    } catch (err) {
      toastError('Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mortality Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate official PDF reports for your assigned farm batches.
          </p>
        </div>

        {reportData && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs no-print">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Report Configuration</span>
        </h3>

        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Farm</label>
              <select
                value={selectedFarm}
                onChange={(e) => handleFarmChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shade</label>
              <select
                value={selectedShade}
                onChange={(e) => handleShadeChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="">All Shades</option>
                {shades.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shade_number} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} ({b.breed})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-70"
            >
              {loading ? 'Compiling Report...' : 'Generate & Preview Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Generating mortality report..." />
        </div>
      ) : reportData ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md max-w-4xl mx-auto print-page">
          <div className="text-center pb-6 border-b-2 border-emerald-600">
            <h2 className="text-2xl font-black text-emerald-800 tracking-tight uppercase">
              Poultry Farm Mortality Report
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">
              Farm Management Production Summary
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <p className="text-slate-500">Farm:</p>
              <p className="font-bold text-slate-900 text-sm">{reportData.farm_name}</p>
            </div>
            <div>
              <p className="text-slate-500">Batch:</p>
              <p className="font-bold text-slate-900 text-sm font-mono">{reportData.batch_number}</p>
            </div>
            <div>
              <p className="text-slate-500">Shade:</p>
              <p className="font-bold text-slate-900">{reportData.shade_name}</p>
            </div>
            <div>
              <p className="text-slate-500">Date Range:</p>
              <p className="font-bold text-slate-900">
                {reportData.date_from} → {reportData.date_to}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
            <div>
              <p className="text-[10px] text-emerald-800 font-bold uppercase">Initial Birds</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {reportData.initial_birds.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-800 font-bold uppercase">Current Birds</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {reportData.current_birds.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-800 font-bold uppercase">Total Mortality</p>
              <p className="text-xl font-extrabold text-rose-600 mt-0.5">
                {reportData.total_mortality.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-800 font-bold uppercase">Mortality Rate</p>
              <p className="text-xl font-extrabold text-amber-600 mt-0.5">
                {reportData.mortality_percentage}%
              </p>
            </div>
          </div>

          <div className="my-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Daily Mortality Log Breakdown
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-800 text-white uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Shade</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3 text-center">Mortality</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Remarks</th>
                    <th className="px-4 py-3">Reported By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.records.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-6 text-center text-slate-400 italic">
                        No mortality records found for this period.
                      </td>
                    </tr>
                  ) : (
                    reportData.records.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{r.date}</td>
                        <td className="px-4 py-3 text-slate-700">{r.shade_name}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{r.batch_number}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600">
                          {r.mortality_count}
                        </td>
                        <td className="px-4 py-3 text-slate-800">{r.reason}</td>
                        <td className="px-4 py-3 text-slate-500">{r.remarks || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{r.manager_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Generated On: <b>{reportData.generated_at}</b></span>
            <span>Generated By: <b>{reportData.generated_by}</b></span>
            <span className="text-emerald-700 font-bold">Authorized Farm Report</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManagerReportsPage;
