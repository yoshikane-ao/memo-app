import axios, { type AxiosRequestConfig } from 'axios';
import { toApiRequestError } from './apiError';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL,
  // httpOnly cookie (access_token / refresh_token) を付与するため true。
  // 同一オリジンでも念のため明示する。
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<void> | null = null;

const performRefresh = async (): Promise<void> => {
  if (!refreshInFlight) {
    refreshInFlight = api
      .post('/auth/refresh', null, { _retry: true } as RetryableConfig)
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

const shouldAttemptRefresh = (config: RetryableConfig | undefined, status: number | undefined) => {
  if (!config || status !== 401 || config._retry) return false;
  const url = config.url ?? '';
  // refresh / login / register / logout 自身の 401 では再試行しない（ループ防止）
  return !url.startsWith('/auth/');
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status as number | undefined;

    if (shouldAttemptRefresh(config, status) && config) {
      config._retry = true;
      try {
        await performRefresh();
        return api(config);
      } catch {
        // refresh 失敗時は元の 401 をそのまま上位に伝える
      }
    }

    return Promise.reject(toApiRequestError(error));
  },
);

export async function getJson<T>(url: string): Promise<T> {
  const response = await api.get<T>(url);
  return response.data;
}

export async function postJson<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
): Promise<TResponse> {
  const response = await api.post<TResponse>(url, body);
  return response.data;
}

export async function putJson<TResponse = void, TBody = unknown>(
  url: string,
  body?: TBody,
): Promise<TResponse> {
  const response = await api.put<TResponse>(url, body);
  return response.data;
}

export async function patchJson<TResponse = void, TBody = unknown>(
  url: string,
  body?: TBody,
): Promise<TResponse> {
  const response = await api.patch<TResponse>(url, body);
  return response.data;
}

export async function deleteJson<TResponse = void>(url: string): Promise<TResponse> {
  const response = await api.delete<TResponse>(url);
  return response.data;
}
