import apiClient from './apiClient';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.data;
  },

  signup: async (data: { name: string; email: string; password: string; department: string; role: string; }) => {
    const response = await apiClient.post('/api/auth/signup', data);
    return response.data;
  },

  getMe: async (token: string) => {
    const response = await apiClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
