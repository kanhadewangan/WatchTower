import api from '../config/api';

export const checksService = {
  addCheck: async (checkData) => {
    const response = await api.post('/checks/add-check', checkData);
    return response.data;
  },

  getChecks: async (websitename) => {
    const response = await api.get(`/checks/checks/${websitename}`);
    return response.data;
  },

  getUptime: async (websitename) => {
    const response = await api.get(`/checks/uptime/${websitename}`);
    return response.data;
  },

  getLatestCheck: async (websitename) => {
    const response = await api.get(`/checks/latest-check/${websitename}`);
    return response.data;
  },

  getLast1Hour: async (websitename) => {
    const response = await api.get(`/checks/last-1-hour/${websitename}`);
    return response.data;
  },

  getLast24Hours: async (websitename) => {
    const response = await api.get(`/checks/last-24-hours/${websitename}`);
    return response.data;
  },

  getLast7Days: async (websitename) => {
    const response = await api.get(`/checks/last-7-days/${websitename}`);
    return response.data;
  },

  getLast30Days: async (websitename) => {
    const response = await api.get(`/checks/last-30-days/${websitename}`);
    return response.data;
  },

  deleteChecks: async (websitename) => {
    const response = await api.delete(`/checks/checks/${websitename}`);
    return response.data;
  },
};
