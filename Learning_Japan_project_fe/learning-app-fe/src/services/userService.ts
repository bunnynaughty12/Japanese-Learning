import axios from "axios";
import { axiosClient, HttpClientError } from "@/lib/axios";
import { getEndpoint } from "@/config/api";
import { ApiResponse } from "./api-types"; // <-- dùng từ file api-types
import { API_ENDPOINTS } from "@/config/api";
import { JLPTLevel } from "@/enums/JLPTLevel";
import { http } from "@/lib/http";
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface UserProfileResponse {
  fullName: string;
  email: string;
  createdAt: string;
  avatarUrl: string;
  level: JLPTLevel;
  avatar?: string;
  isPremium?: boolean;
  roles?: string[];
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string; // Backend là fullName, không phải name
  avatarUrl?: string;
  enabled: boolean;
  level: JLPTLevel;

  stage: string; // "Junbi"
  processPercent: number; // 60
  isPremium: boolean; // true/false

  createdAt: string;
}

export interface UserResponseManager {
  id: string;
  email: string;
  fullName: string; // Backend là fullName, không phải name
  avatarUrl?: string;
  enabled: boolean;
  role: string[]; // Ví dụ: ["USER"], ["ADMIN"]

  // Các field học tập mới thêm
  level: string; // "N5"
  stage: string; // "Junbi"
  processPercent: number; // 60
  isPremium: boolean; // true/false

  createdAt: string;
}
export interface UserChatResponse {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string; // Một số chỗ dùng avatarUrl
  avatar?: string;    // Một số chỗ dùng avatar
  level?: string;
  isPremium?: boolean;
}
export interface UpdateUserRequest {
  fullName: string; // Backend là fullName, không phải name
  level: JLPTLevel;

}
export interface PageResponse<T> {
  page: number;
  totalPages: number;
  size: number;
  totalElements: number;
  data: T[]; // Danh sách user nằm ở đây
}

export interface UserStatsResponse {
  total: number;
  active: number;
  banned: number;
}

export const userService = {
  getProfile(): Promise<UserProfileResponse> {
    return http.get(API_ENDPOINTS.USER.PROFILE); // token đi kèm trong header
  },

  updateProfile(data: UpdateUserRequest): Promise<UserProfileResponse> {
    return http.put(API_ENDPOINTS.USER.UPDATE_PROFILE, data);
  },

  uploadAvatar(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    return http.put(API_ENDPOINTS.USER.UPLOAD_AVATAR, formData);
  },

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return http.post(API_ENDPOINTS.USER.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  },

  // lấy tất cả user cho admin
  getAllUsers(
    page: number,
    size: number,
    search?: string
  ): Promise<PageResponse<UserResponse>> {
    const params: Record<string, string | number> = { page, size };
    if (search) {
      params.search = search;
    }
    return http.get(API_ENDPOINTS.USER.ALL_USERS, { params });
  },

  // lấy chi tiết user cho admin
  getAllUsersManager(
    page: number,
    size: number,
    search?: string
  ): Promise<PageResponse<UserResponseManager>> {
    const params: Record<string, string | number> = { page, size };
    if (search) {
      params.search = search;
    }
    return http.get(API_ENDPOINTS.ADMIN.ALL_USERS_MANAGER, { params });
  },

  /**
   * Ban (Khóa) tài khoản user dựa trên email
   * Endpoint: POST /api/admin/users/{email}/ban
   */
  banUser(email: string): Promise<void> {
    // Lưu ý: Đảm bảo đường dẫn khớp với Controller Backend bạn vừa viết
    // Nếu bạn chưa cấu hình trong API_ENDPOINTS, hãy viết trực tiếp string như dưới:
    return http.post(API_ENDPOINTS.ADMIN.BAN_USER(email));
  },

  /**
   * Unban (Mở khóa) tài khoản user dựa trên email
   * Endpoint: POST /api/admin/users/{email}/unban
   */
  unbanUser(email: string): Promise<void> {
    return http.post(API_ENDPOINTS.ADMIN.UNBAN_USER(email));
  },

  deleteUserAccount(email: string): Promise<void> {
    return http.delete(API_ENDPOINTS.ADMIN.DELETE_USER, {
      params: { email },
    });
  },

  deleteMultipleUserAccounts(emails: string[]): Promise<void> {
    return http.delete(API_ENDPOINTS.ADMIN.DELETE_USERS, {
      data: { emails },
    });
  },
  searchUsers(keyword: string): Promise<UserChatResponse[]> {
    return http.get(API_ENDPOINTS.USER.SEARCH, {
      params: { keyword },
    });
  },

  getUserStatistics(): Promise<UserStatsResponse> {
    return http.get(API_ENDPOINTS.ADMIN.USER_STATISTICS);
  },
  getUserById(id: string): Promise<UserChatResponse> {
    return http.get<UserChatResponse>(API_ENDPOINTS.USER.GET_USER_BY_ID(id));
  },
};

export const register = async (
  data: RegisterRequest
): Promise<RegisterResult> => {
  try {
    const endpoint = getEndpoint("REGISTER");

    // Gọi API, kiểu ApiResponse<RegisterResult>
    const response = await axiosClient.post<ApiResponse<RegisterResult>>(
      endpoint,
      data,
      { headers: { Authorization: undefined } }
    );

    const resData = response.data;

    // Check success từ backend
    if (!resData.success) {
      throw new Error(resData.message || "Đăng ký thất bại");
    }

    return resData.result;
  } catch (error: unknown) {
    // Xử lý lỗi
    if (error instanceof HttpClientError) {
      throw new Error(error.message || "Đăng ký thất bại");
    }

    if (axios.isAxiosError(error)) {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        error.message;
      throw new Error(msg);
    }

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Có lỗi xảy ra");
  }
};
