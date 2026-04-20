import { defineStore } from 'pinia';
import { ApiRequestError } from '../api/apiError';
import { authApi, type AuthUserDto } from './authApi';

type AuthState = {
  user: AuthUserDto | null;
  hydrated: boolean;
  pending: boolean;
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    hydrated: false,
    pending: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    async hydrate(): Promise<void> {
      if (this.hydrated) return;
      this.pending = true;
      try {
        this.user = await authApi.me();
      } catch (error) {
        // 401 (未ログイン) は期待動作、それ以外は黙って null に倒す。
        if (!(error instanceof ApiRequestError) || error.status !== 401) {
          console.warn('auth hydrate failed', error);
        }
        this.user = null;
      } finally {
        this.hydrated = true;
        this.pending = false;
      }
    },
    async login(email: string, password: string): Promise<void> {
      this.pending = true;
      try {
        this.user = await authApi.login({ email, password });
        this.hydrated = true;
      } finally {
        this.pending = false;
      }
    },
    async register(email: string, password: string, displayName?: string): Promise<void> {
      this.pending = true;
      try {
        this.user = await authApi.register({ email, password, displayName });
        this.hydrated = true;
      } finally {
        this.pending = false;
      }
    },
    async logout(): Promise<void> {
      try {
        await authApi.logout();
      } finally {
        this.user = null;
      }
    },
  },
});
