import axios from "axios";
import { axiosClient, HttpClientError } from "@/lib/axios";
import { getEndpoint } from "@/config/api";
import { ApiResponse } from "./api-types";
import { useAuthStore } from "@/stores/authStore";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  username: string;
  refreshToken: string;
}

export interface ConfirmForgotPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// ----- Login API -----
export const login = async (data: LoginRequest): Promise<UserLoginResponse> => {
  try {
    const endpoint = getEndpoint("LOGIN");

    const response = await axiosClient.post<ApiResponse<UserLoginResponse>>(
      endpoint,
      data,
      { headers: { Authorization: undefined } }
    );

    const resData = response.data;

    if (!resData.success) {
      throw new Error(resData.message || "Đăng nhập thất bại");
    }

    const result = resData.result;

    const { setTokens } = useAuthStore.getState();
    setTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    axiosClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${result.accessToken}`;

    return result;
  } catch (error: unknown) {
    if (error instanceof HttpClientError)
      throw new Error(error.message || "Đăng nhập thất bại");
    if (axios.isAxiosError(error)) {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        error.message;
      throw new Error(msg);
    }
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Có lỗi xảy ra");
  }
};

// ----- Refresh Token API -----
export const refreshToken = async (
  data: RefreshTokenRequest
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const endpoint = getEndpoint("REFRESH_TOKEN");

    const response = await axiosClient.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >(endpoint, data);

    const resData = response.data;
    if (!resData.success)
      throw new Error(resData.message || "Làm mới token thất bại");

    const result = resData.result;

    const { setTokens } = useAuthStore.getState();
    setTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    axiosClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${result.accessToken}`;

    return result;
  } catch (error: unknown) {
    if (error instanceof HttpClientError)
      throw new Error(error.message || "Làm mới token thất bại");
    if (axios.isAxiosError(error)) {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        error.message;
      throw new Error(msg);
    }
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Có lỗi xảy ra");
  }
};

// ----- Logout API -----
export const logout = async (): Promise<void> => {
  try {
    const { accessToken, logout } = useAuthStore.getState();

    if (!accessToken) return;

    const endpoint = getEndpoint("LOG_OUT");

    await axiosClient.post<ApiResponse<null>>(endpoint, { accessToken });

    // Dùng logout action trong store để xóa token
    logout();
    delete axiosClient.defaults.headers.common["Authorization"];
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        error.message;
      throw new Error(msg);
    }
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Có lỗi xảy ra khi đăng xuất");
  }
};

export const forgotPassword = async (email: string): Promise<string> => {
  try {
    // Lưu ý: Cần thêm key FORGOT_PASSWORD vào file config/api.ts
    const endpoint = getEndpoint("FORGOT_PASSWORD");

    // Backend dùng @RequestParam String email, nên ta truyền qua params
    const response = await axiosClient.post<ApiResponse<string>>(
      endpoint,
      null, // Body là null vì dùng @RequestParam
      {
        params: { email },
        headers: { Authorization: undefined }, // API public
      }
    );

    const resData = response.data;
    if (!resData.success) {
      throw new Error(resData.message || "Gửi yêu cầu thất bại");
    }

    return resData.message || "OTP đã được gửi";
  } catch (error: unknown) {
    if (error instanceof HttpClientError)
      throw new Error(error.message || "Gửi yêu cầu thất bại");
    if (axios.isAxiosError(error)) {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        error.message;
      throw new Error(msg);
    }
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Có lỗi xảy ra");
  }
};

// ----- Confirm Forgot Password API (Xác nhận OTP & Đổi pass) -----
export const confirmForgotPassword = async (
  data: ConfirmForgotPasswordRequest
): Promise<string> => {
  try {
    // Lưu ý: Cần thêm key CONFIRM_FORGOT_PASSWORD vào file config/api.ts
    const endpoint = getEndpoint("CONFIRM_FORGOT_PASSWORD");

    // Backend dùng @RequestBody ForgotPasswordRequest
    const response = await axiosClient.post<ApiResponse<string>>(
      endpoint,
      data,
      { headers: { Authorization: undefined } } // API public
    );

    const resData = response.data;
    if (!resData.success) {
      throw new Error(resData.message || "Đổi mật khẩu thất bại");
    }

    return resData.message || "Đổi mật khẩu thành công";
  } catch (error: unknown) {
    if (error instanceof HttpClientError)
      throw new Error(error.message || "Đổi mật khẩu thất bại");
    if (axios.isAxiosError(error)) {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        error.message;
      throw new Error(msg);
    }
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Có lỗi xảy ra");
  }
};
