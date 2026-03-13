import { api } from './api';

export const AuthService = {
  login: async (credentials: { nik: string; password: string }) => {
    return await api.post('/api/auth/login', credentials);
  },

  register: async (data: any) => {
    return await api.post('/api/auth/register', data);
  },

  forgotPassword: async (data: { nik: string; no_hp: string }) => {
    return await api.post('/api/auth/forgot-password', data);
  },
};
