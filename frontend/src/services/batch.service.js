import api from './api';

export const batchService = {
  async getBatches(filters = {}) {
    const res = await api.get('/batches', { params: filters });
    return res.data;
  },

  async getBatch(id) {
    const res = await api.get(`/batches/${id}`);
    return res.data;
  },

  async createBatch(data) {
    const payload = {
      ...data,
      expected_end_date: data.expected_end_date && data.expected_end_date.trim() ? data.expected_end_date : null,
      notes: data.notes && data.notes.trim() ? data.notes.trim() : null,
    };
    const res = await api.post('/batches', payload);
    return res.data;
  },

  async updateBatch(id, data) {
    const payload = {
      ...data,
      expected_end_date: data.expected_end_date !== undefined
        ? (data.expected_end_date && data.expected_end_date.trim() ? data.expected_end_date : null)
        : undefined,
      notes: data.notes !== undefined
        ? (data.notes && data.notes.trim() ? data.notes.trim() : null)
        : undefined,
    };
    const res = await api.put(`/batches/${id}`, payload);
    return res.data;
  },
};
