import api from './api';

export const farmService = {
  async getFarms(search = '') {
    const params = search ? { search } : {};
    const res = await api.get('/farms', { params });
    return res.data;
  },

  async getFarm(id) {
    const res = await api.get(`/farms/${id}`);
    return res.data;
  },

  async createFarm(data) {
    const res = await api.post('/farms', data);
    return res.data;
  },

  async updateFarm(id, data) {
    const res = await api.put(`/farms/${id}`, data);
    return res.data;
  },

  async deleteFarm(id) {
    const res = await api.delete(`/farms/${id}`);
    return res.data;
  },
};
