import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (Inject Token)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Handle 401 Unauthorized)
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop if login fails with 401
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('auth/login')
    ) {
      originalRequest._retry = true;
      const { logout } = useAuthStore.getState();
      await logout();
      // Router will automatically redirect based on store state in _layout.tsx
    }
    
    return Promise.reject(error.response?.data || error);
  }
);
