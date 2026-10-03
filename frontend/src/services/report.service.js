import api from './api';

export const reportService = {
  async getMortalityReport(params = {}) {
    const res = await api.get('/reports/mortality', { params });
    return res.data;
  },

  async downloadMortalityPdf(params = {}) {
    const res = await api.get('/reports/mortality/pdf', {
      params,
      responseType: 'blob',
    });
    // Create download link
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `poultry_mortality_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
