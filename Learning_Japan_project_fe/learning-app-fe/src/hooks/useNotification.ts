"use client";

import { useEffect, useState } from "react";
import { Notification } from "@/types/notification";
import {
  connectNotificationSocket,
  NotificationSocketDTO,
} from "@/services/notificationSocket";
import { getUserIdFromToken } from "@/utils/jwt";

const convertToNotification = (dto: NotificationSocketDTO): Notification => ({
  id: dto.id,
  title: dto.title,
  content: dto.content,
  createdAt: dto.createdAt,
  isRead: false,
});

export const useNotification = () => {
  // ✅ Lazy init – chạy đúng 1 lần, không effect
  const [userId] = useState<string | null>(() => getUserIdFromToken());
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🔔 Chỉ effect khi có userId
  useEffect(() => {
    if (!userId) return;

    console.log("🔔 Connecting notification socket for user:", userId);

    const socket = connectNotificationSocket(
      userId,
      (data: NotificationSocketDTO) => {
        setNotifications((prev) => [convertToNotification(data), ...prev]);
      }
    );

    return () => {
      console.log("🔌 Disconnect notification socket");
      socket.disconnect();
    };
  }, [userId]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
