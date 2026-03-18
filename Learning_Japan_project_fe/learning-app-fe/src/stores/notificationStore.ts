import { create } from "zustand";
import { Notification } from "@/types/notification";
import {
  notificationService,
  NotificationResponse,
} from "@/services/notificationService";

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Getters
  getUnreadCount: () => number;
}

const convertToNotification = (dto: NotificationResponse): Notification => ({
  id: dto.id,
  title: dto.title,
  content: dto.content,
  createdAt: dto.createdAt,
  isRead: dto.isRead,
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  isInitialized: false,

  // 📥 Load từ DB
  loadNotifications: async () => {
    const state = get();
    if (state.isInitialized) {
      console.log("⚠️ Notifications already loaded, skipping...");
      return;
    }

    set({ isLoading: true });
    try {
      console.log("📥 Loading notifications from DB...");
      const response = await notificationService.getMyNotifications(0, 50);
      const notifications = response.content.map(convertToNotification);

      set({
        notifications,
        isLoading: false,
        isInitialized: true,
      });

      console.log(`✅ Loaded ${notifications.length} notifications`);
    } catch (error) {
      console.error("❌ Failed to load notifications:", error);
      set({ isLoading: false });
    }
  },

  // ➕ Thêm notification mới (từ WebSocket)
  addNotification: (notification) =>
    set((state) => {
      // ✅ Kiểm tra duplicate
      const exists = state.notifications.some((n) => n.id === notification.id);
      if (exists) {
        console.log("⚠️ Duplicate notification ignored:", notification.id);
        return state;
      }

      console.log("📩 New notification added:", notification.title);
      return {
        notifications: [notification, ...state.notifications],
      };
    }),

  // ✅ Đánh dấu đã đọc
  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
      console.log("✅ Marked as read:", id);
    } catch (error) {
      console.error("❌ Failed to mark as read:", error);
      throw error;
    }
  },

  // ✅ Đánh dấu tất cả đã đọc
  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
      console.log("✅ All notifications marked as read");
    } catch (error) {
      console.error("❌ Failed to mark all as read:", error);
      throw error;
    }
  },

  // 🗑️ Xóa notification
  deleteNotification: async (id) => {
    try {
      await notificationService.delete(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
      console.log("🗑️ Notification deleted:", id);
    } catch (error) {
      console.error("❌ Failed to delete notification:", error);
      throw error;
    }
  },

  // 📊 Đếm số unread
  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.isRead).length;
  },
}));
