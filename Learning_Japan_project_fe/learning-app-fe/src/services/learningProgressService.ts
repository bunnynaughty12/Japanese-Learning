import { axiosClient } from "@/lib/axios";
import { ApiResponse } from "@/services/api-types";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/stores/authStore";

/* ==================== TYPES ==================== */

export interface LevelProgressDto {
  level: string;
  totalExamsTaken: number;
  totalQuestionsDone: number;
  correctQuestions: number;
  averageScore?: number;
  accuracy: number;
  lastExamAt?: string;
}

export interface DailyProgressDto {
  date: string;
  totalExamsTaken: number;
  totalQuestionsDone: number;
  correctQuestions: number;
  accuracy: number;
}

export interface UserResponse { // Interface phụ cho User
    id: string;
    email: string;
    fullName: string;
    enabled: boolean;
    createdAt: string;
    avatarUrl?: string; // Dấu ? vì có thể null
}

export interface UserLearningDashboardResponse {
  userId: string;
  totalExamsTaken: number;
  totalQuestionsDone: number;
  correctQuestions: number;
  accuracy: number;
  lastLevel?: string;
  lastExamAt?: string;
  levels: LevelProgressDto[];
  user: UserResponse; // <--- Quan trọng: Phải khớp tên biến
}

/* ==================== HELPERS ==================== */

const getHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  return {
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };
};

async function fetchAPI<T>(url: string): Promise<T> {
  const res = await axiosClient.get<ApiResponse<T>>(url, {
    headers: getHeaders(),
  });

  if (!res.data.success) {
    throw new Error(res.data.message || "API Error");
  }

  return res.data.result;
}

/* ==================== SERVICE ==================== */

export const learningProgressService = {
  /**
   * Lấy dashboard học tập
   * ❌ Không cache
   */
  async view(): Promise<UserLearningDashboardResponse> {
    return fetchAPI<UserLearningDashboardResponse>(
      API_ENDPOINTS.LEARNING_PROGRESS.PROGRESS_VIEW
    );
  },

  //LAY DASHBOARD HOC TAP CHO ADMIN
  async getAdminUserProgress(userId: string): Promise<UserLearningDashboardResponse> {
     return fetchAPI<UserLearningDashboardResponse>(
      API_ENDPOINTS.ADMIN.PROGRESS_VIEW.replace(':userId', userId)
    );
  },

  /**
   * ADMIN: Lấy biểu đồ hàng ngày của 1 user cụ thể
   * (Cần thêm hàm này nếu muốn biểu đồ 7 ngày chạy đúng data user đó)
   */
  async getAdminDailyProgress(userId: string, days: number = 7): Promise<DailyProgressDto[]> {
     return fetchAPI<DailyProgressDto[]>(
      `${API_ENDPOINTS.ADMIN.PROGRESS_RESULT_DAILY.replace(':userId', userId)}?days=${days}`
    );
  },

  /**
   * Lấy daily progress
   * ❌ Không cache
   */
  async getDailyProgress(days: number = 7): Promise<DailyProgressDto[]> {
    return fetchAPI<DailyProgressDto[]>(
      `${API_ENDPOINTS.LEARNING_PROGRESS.PROGRESS_RESULT_DAILY}/daily?days=${days}`
    );
  },
};
