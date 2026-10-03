import api from './api';

export const mortalityService = {
  async addMortality(data) {
    const res = await api.post('/mortality', data);
    return res.data;
  },

  async getMortalities(params = {}) {
    const res = await api.get('/mortality', { params });
    return res.data;
  },

  async updateMortality(id, data) {
    const res = await api.put(`/mortality/${id}`, data);
    return res.data;
  },

  async deleteMortality(id) {
    const res = await api.delete(`/mortality/${id}`);
    return res.data;
  },
};
