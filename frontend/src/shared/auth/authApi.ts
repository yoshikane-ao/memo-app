import { api } from '../api/client';

export interface AuthUserDto {
  id: number;
  email: string;
  displayName: string | null;
}

interface AuthResponse {
  user: AuthUserDto;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthUserDto> {
    const res = await api.post<AuthResponse>('/auth/register', payload);
    return res.data.user;
  },
  async login(payload: LoginPayload): Promise<AuthUserDto> {
    const res = await api.post<AuthResponse>('/auth/login', payload);
    return res.data.user;
  },
  async me(): Promise<AuthUserDto> {
    const res = await api.get<AuthResponse>('/auth/me');
    return res.data.user;
  },
  async refresh(): Promise<AuthUserDto> {
    const res = await api.post<AuthResponse>('/auth/refresh');
    return res.data.user;
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
