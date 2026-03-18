import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function saveToken(token: string) {
  localStorage.setItem("token", token);
  setAuthToken(token);
}

export function clearToken() {
  localStorage.removeItem("token");
  setAuthToken(null);
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function saveRefreshToken(token: string) {
  localStorage.setItem("refreshToken", token);
}

export function clearRefreshToken() {
  localStorage.removeItem("refreshToken");
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearToken();
        clearRefreshToken();
        return Promise.reject(error);
      }

      try {
        const res = await api.post("/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = res.data.token as string | undefined;

        if (!newAccessToken) {
          throw new Error("token が返ってきませんでした");
        }

        saveToken(newAccessToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        clearToken();
        clearRefreshToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);