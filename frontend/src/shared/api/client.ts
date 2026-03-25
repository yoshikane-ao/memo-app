import axios from "axios";
import { toApiRequestError } from "./apiError";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiRequestError(error))
);

export async function getJson<T>(url: string): Promise<T> {
  const response = await api.get<T>(url);
  return response.data;
}

export async function postJson<TResponse, TBody = unknown>(
  url: string,
  body?: TBody
): Promise<TResponse> {
  const response = await api.post<TResponse>(url, body);
  return response.data;
}

export async function putJson<TResponse = void, TBody = unknown>(
  url: string,
  body?: TBody
): Promise<TResponse> {
  const response = await api.put<TResponse>(url, body);
  return response.data;
}

export async function deleteJson<TResponse = void>(url: string): Promise<TResponse> {
  const response = await api.delete<TResponse>(url);
  return response.data;
}
