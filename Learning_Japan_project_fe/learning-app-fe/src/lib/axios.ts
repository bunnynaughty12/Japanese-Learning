// src/lib/axios-client.ts
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { refreshToken as refreshTokenApi } from "@/services/authService";

// ----- Axios public (không auth) -----
export const axiosPublic = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 10000,
  headers: {
    Authorization: undefined,
  },
});

// ----- Axios client (cần auth) -----
export const axiosClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 60000, // 👈 tăng lên 60s cho AI
});

// ----- Axios client cho upload (timeout 10 phút) -----
export const axiosUpload = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 600000, // 10 phút (600,000ms)
});

// ----- Custom error -----
export class HttpClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HttpClientError";
  }
}

// ----- Helper decode JWT -----
const getTokenExpiration = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // ms
  } catch {
    return 0;
  }
};

// ----- Axios interceptor tự động refresh token cho axiosClient -----
axiosClient.interceptors.request.use(async (config) => {
  const { accessToken, refreshToken, logout, setTokens, user } =
    useAuthStore.getState();

  if (!accessToken) return config;

  const now = Date.now();
  const exp = getTokenExpiration(accessToken);

  // Đảm bảo config.headers đúng type AxiosHeaders
  if (!config.headers) {
    config.headers = axios.AxiosHeaders.from({});
  } else if (!(config.headers instanceof axios.AxiosHeaders)) {
    config.headers = axios.AxiosHeaders.from(config.headers);
  }

  // Nếu token sắp hết hạn <1 phút, refresh token
  if (exp - now < 60 * 1000 && refreshToken && user?.username) {
    try {
      const result = await refreshTokenApi({
        username: user.username,
        refreshToken,
      });

      setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      config.headers.set("Authorization", `Bearer ${result.accessToken}`);
    } catch (err) {
      console.error("Refresh token failed", err);
      logout();
    }
  } else {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

// ----- Axios interceptor tự động refresh token cho axiosUpload -----
axiosUpload.interceptors.request.use(async (config) => {
  const { accessToken, refreshToken, logout, setTokens, user } =
    useAuthStore.getState();

  if (!accessToken) return config;

  const now = Date.now();
  const exp = getTokenExpiration(accessToken);

  // Đảm bảo config.headers đúng type AxiosHeaders
  if (!config.headers) {
    config.headers = axios.AxiosHeaders.from({});
  } else if (!(config.headers instanceof axios.AxiosHeaders)) {
    config.headers = axios.AxiosHeaders.from(config.headers);
  }

  // Nếu token sắp hết hạn <1 phút, refresh token
  if (exp - now < 60 * 1000 && refreshToken && user?.username) {
    try {
      const result = await refreshTokenApi({
        username: user.username,
        refreshToken,
      });

      setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      config.headers.set("Authorization", `Bearer ${result.accessToken}`);
    } catch (err) {
      console.error("Refresh token failed", err);
      logout();
    }
  } else {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});
