import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// API base URL - use the production URL
const API_BASE_URL = 'https://trashport.shop/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      // Token expired, redirect to login
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const collectorsApi = {
  // Get all collectors (with filters)
  getAll: (params?: { hub_id?: number; city_id?: number; is_verified?: boolean }) =>
    api.get('/collectors/', { params }),

  // Get collectors grouped by hub
  getByHub: (hubId?: number) =>
    api.get('/collectors/by_hub/', { params: { hub_id: hubId } }),

  // Register new collector
  register: (data: any) =>
    api.post('/collectors/register/', data),

  // Get collector by ID
  getById: (id: number) =>
    api.get(`/collectors/${id}/`),

  // Update collector vehicle details
  updateVehicle: (id: number, data: any) =>
    api.patch(`/collectors/${id}/update_vehicle/`, data),

  // Approve collector (admin)
  approve: (id: number) =>
    api.post(`/collectors/${id}/approve/`),

  // Reject collector (admin)
  reject: (id: number) =>
    api.post(`/collectors/${id}/reject/`),
};

export const hubsApi = {
  // Get all hubs
  getAll: (cityId?: number) =>
    api.get('/collector-hubs/', { params: { city_id: cityId } }),

  // Get hub by ID
  getById: (id: number) =>
    api.get(`/collector-hubs/${id}/`),
};

export const collectorProfileApi = {
  // Get current collector's profile
  getMe: () =>
    api.get('/collector-profile/me/'),

  // Update current collector's profile
  updateMe: (data: any) =>
    api.patch('/collector-profile/me/', data),
};

export const citiesApi = {
  // Get all cities
  getAll: () =>
    api.get('/cities/'),
};

export const authApi = {
  // Login
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),

  // Logout
  logout: () =>
    api.post('/auth/logout/'),
};
