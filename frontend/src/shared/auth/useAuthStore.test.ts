import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activateTestPinia } from '../../test/pinia';
import { ApiRequestError } from '../api/apiError';
import { authApi, type AuthUserDto } from './authApi';
import { useAuthStore } from './useAuthStore';

vi.mock('./authApi', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

const makeUser = (overrides: Partial<AuthUserDto> = {}): AuthUserDto => ({
  id: 1,
  email: 'user@example.com',
  displayName: 'User',
  ...overrides,
});

describe('useAuthStore', () => {
  beforeEach(() => {
    activateTestPinia();
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('hydrate fills user when /auth/me succeeds', async () => {
    vi.mocked(authApi.me).mockResolvedValue(makeUser());
    const store = useAuthStore();

    await store.hydrate();

    expect(store.user).toEqual(makeUser());
    expect(store.isAuthenticated).toBe(true);
    expect(store.hydrated).toBe(true);
  });

  it('hydrate leaves user null on 401 without warning', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiRequestError('unauthorized', { status: 401 }));
    const store = useAuthStore();

    await store.hydrate();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.hydrated).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('hydrate is idempotent once completed', async () => {
    vi.mocked(authApi.me).mockResolvedValue(makeUser());
    const store = useAuthStore();

    await store.hydrate();
    await store.hydrate();

    expect(authApi.me).toHaveBeenCalledTimes(1);
  });

  it('login sets user and marks hydrated', async () => {
    vi.mocked(authApi.login).mockResolvedValue(makeUser({ id: 42 }));
    const store = useAuthStore();

    await store.login('user@example.com', 'password');

    expect(store.user?.id).toBe(42);
    expect(store.hydrated).toBe(true);
  });

  it('login propagates errors and leaves user null', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiRequestError('invalid', { status: 401 }));
    const store = useAuthStore();

    await expect(store.login('user@example.com', 'wrong')).rejects.toBeInstanceOf(ApiRequestError);
    expect(store.user).toBeNull();
  });

  it('register sets user', async () => {
    vi.mocked(authApi.register).mockResolvedValue(makeUser({ id: 7, displayName: 'Taro' }));
    const store = useAuthStore();

    await store.register('taro@example.com', 'password', 'Taro');

    expect(store.user?.displayName).toBe('Taro');
  });

  it('logout clears user even if API call throws', async () => {
    vi.mocked(authApi.me).mockResolvedValue(makeUser());
    const store = useAuthStore();
    await store.hydrate();
    vi.mocked(authApi.logout).mockRejectedValue(new ApiRequestError('network error'));

    await expect(store.logout()).rejects.toBeInstanceOf(ApiRequestError);
    expect(store.user).toBeNull();
  });
});
