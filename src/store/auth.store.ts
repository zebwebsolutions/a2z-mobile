import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/services/api';

type AuthState = {
  user: any | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true, // important for splash / guard
  hydrated: false,

  restore: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const user = await SecureStore.getItemAsync('user');

      if (!token || !user) {
        delete api.defaults.headers.common.Authorization;
        set({ token: null, user: null, loading: false, hydrated: true });
        return;
      }

      // Verify token is still valid
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      
      try {
        const res = await api.get('/me'); // or '/user' endpoint
        set({
          token,
          user: res.data, // Use fresh user data
          loading: false,
          hydrated: true,
        });
      } catch (verifyError) {
        // Token invalid/expired - clear everything
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        delete api.defaults.headers.common.Authorization;
        set({ token: null, user: null, loading: false, hydrated: true });
      }
    } catch (e) {
      delete api.defaults.headers.common.Authorization;
      set({ token: null, user: null, loading: false, hydrated: true });
    }
  },


  login: async (email, password) => {
  try {
    set({ loading: true });

    const payload = {
      email,
      password,
      device_name: 'mobile',
    };

    const res = await api.post('/login', payload);

    console.log('Login response status:', res.status);
    console.log('Login response data:', res.data);

    const {token, user} = res.data;

    console.log('Login response:', { token, user });

    if (!token || !user) {
      throw new Error('Invalid login response');
    }

    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    set({
      user,
      token,
      loading: false,
      hydrated: true,
    });
  } catch (e: any) {
    set({ loading: false });
    throw e;
  }
},


  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');

    delete api.defaults.headers.common.Authorization;

    set({
      user: null,
      token: null,
      loading: false,
      hydrated: true,
    });
  },

}));