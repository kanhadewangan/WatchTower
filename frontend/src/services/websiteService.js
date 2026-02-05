import api from '../config/api';

export const websiteService = {
  addWebsite: async (websiteData) => {
    const response = await api.post('/websites/add-website', websiteData);
    return response.data;
  },

  getWebsites: async () => {
    const response = await api.get('/websites/websites');
    return response.data;
  },

  getWebsite: async (id) => {
    const response = await api.get(`/websites/website/${id}`);
    return response.data;
  },

  updateWebsite: async (id, websiteData) => {
    const response = await api.put(`/websites/update-website/${id}`, websiteData);
    return response.data;
  },

  deleteWebsite: async (id) => {
    const response = await api.delete(`/websites/delete-website/${id}`);
    return response.data;
  },
};
