import api from './api';

export const adminService = {
  async getDashboard(days = 30) {
    const res = await api.get('/admin/dashboard', { params: { days } });
    return res.data;
  },

  async getAllManagers() {
    const res = await api.get('/admin/managers');
    return res.data;
  },

  async getPendingManagers() {
    const res = await api.get('/admin/managers/pending');
    return res.data;
  },

  async approveManager(managerId) {
    const res = await api.post(`/admin/managers/${managerId}/approve`);
    return res.data;
  },

  async rejectManager(managerId, reason = '') {
    const res = await api.post(`/admin/managers/${managerId}/reject`, {
      decision: 'REJECT',
      reason,
    });
    return res.data;
  },

  async toggleManagerStatus(managerId, isActive) {
    const res = await api.patch(`/admin/managers/${managerId}/toggle-status`, {
      is_active: isActive,
    });
    return res.data;
  },

  async getAuditLogs(limit = 100, entityType = null) {
    const params = { limit };
    if (entityType) params.entity_type = entityType;
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
};
