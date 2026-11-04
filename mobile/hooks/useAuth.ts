import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';
import { User } from '@/types/user';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  name: string;
  phone_number: string;
  password: string;
  vehicle_number?: string;
  vehicle_type?: string;
  vehicle_capacity_kg?: number;
  vehicle_capacity_pickups?: number;
  license_number?: string;
  hub_id: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await api.get('/collector-profile/me/');
        setUser(response.data);
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login/', { email, password });
    const { token, user: userData } = response.data;
    await SecureStore.setItemAsync('token', token);
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/collectors/register/', data);
    const { token, user: userData } = response.data;
    await SecureStore.setItemAsync('token', token);
    setUser(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await api.patch('/collector-profile/me/', data);
    setUser(response.data);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
