import { axiosClient } from "@/lib/axios";
import { ApiResponse } from "@/services/api-types";
import { AxiosRequestConfig, AxiosResponse } from "axios"; // Import thêm types từ axios

// Helper unwrap response
async function unwrapResponse<T>(
  promise: Promise<AxiosResponse<ApiResponse<T>>>
) {
  const res = await promise;
  // Giả sử API trả về { success: true, result: ... }
  // Nếu API của bạn không có field success, bạn có thể bỏ check này hoặc sửa logic tùy backend
  if (res.data.success === false) {
    throw new Error(res.data.message || "API request failed");
  }
  return res.data.result;
}

export const http = {
  // 1. Thêm tham số `config` (dấu ? nghĩa là không bắt buộc)
  get<T>(url: string, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(axiosClient.get(url, config));
  },

  // 2. Cập nhật tương tự cho các hàm khác
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(axiosClient.post(url, body, config));
  },

  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(axiosClient.put(url, body, config));
  },

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(axiosClient.delete(url, config));
  },
};
