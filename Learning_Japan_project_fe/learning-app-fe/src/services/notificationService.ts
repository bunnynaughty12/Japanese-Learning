// src/services/notificationService.ts
import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface NotificationResponse {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Response phân trang (Spring Page)
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // page hiện tại
}
/* ===================== SERVICE ===================== */

export const notificationService = {
  /**
   * 📥 Lấy notification của user hiện tại (có phân trang)
   */
  getMyNotifications(
    page = 0,
    size = 10
  ): Promise<PageResponse<NotificationResponse>> {
    return http.get<PageResponse<NotificationResponse>>(
      API_ENDPOINTS.NOTIFICATION.GET_MY,
      {
        params: { page, size },
      }
    );
  },

  /**
   * ✅ Đánh dấu đã đọc 1 notification
   */
  markAsRead(notificationId: string): Promise<void> {
    return http.put<void>(
      API_ENDPOINTS.NOTIFICATION.MARK_AS_READ(notificationId)
    );
  },

  /**
   * ✅ Đánh dấu tất cả là đã đọc
   */
  markAllAsRead(): Promise<void> {
    return http.put<void>(API_ENDPOINTS.NOTIFICATION.MARK_ALL_AS_READ);
  },

  /**
   * 🗑️ Xóa notification
   */
  delete(notificationId: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.NOTIFICATION.DELETE(notificationId));
  },
};
