import api from './api';

export const shadeService = {
  async getShadesForFarm(farmId) {
    const res = await api.get(`/farms/${farmId}/shades`);
    return res.data;
  },

  async createShade(farmId, data) {
    const res = await api.post(`/farms/${farmId}/shades`, data);
    return res.data;
  },

  async updateShade(shadeId, data) {
    const res = await api.put(`/shades/${shadeId}`, data);
    return res.data;
  },

  async deleteShade(shadeId) {
    const res = await api.delete(`/shades/${shadeId}`);
    return res.data;
  },
};
