import { useEffect, useRef, useState } from "react";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  connectNotificationSocket,
  NotificationSocketDTO,
  IncomingCallDTO,
} from "@/services/notificationSocket";
import { getUserIdFromToken } from "@/utils/jwt";
import { Notification } from "@/types/notification";

const convertToNotification = (dto: NotificationSocketDTO): Notification => ({
  id: dto.id,
  title: dto.title,
  content: dto.content,
  createdAt: dto.createdAt,
  isRead: dto.isRead,
});


export const useNotificationSync = () => {
  const { loadNotifications, addNotification, isInitialized } =
    useNotificationStore();
  const socketRef = useRef<ReturnType<typeof connectNotificationSocket> | null>(
    null
  );
  const hasInitializedRef = useRef(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallDTO | null>(
    null
  );

  useEffect(() => {
    // Chỉ khởi tạo 1 lần
    if (socketRef.current) return;

    const userId = getUserIdFromToken();
    if (!userId) return;

    if (!isInitialized) {
      loadNotifications();
    }

    console.log("🔔 Initializing notification sync for user:", userId);

    const connection = connectNotificationSocket(
      userId,
      (data: NotificationSocketDTO) => {
        console.log("📩 WebSocket notification received:", data);
        addNotification(convertToNotification(data));
      },
      (callData: IncomingCallDTO) => {
        console.log("📞 Incoming call received:", callData);
        setIncomingCall(callData);
      }
    );

    socketRef.current = connection;

    return () => {
      // Chỉ ngắt kết nối thực sự khi component Unmount hẳn
      // (Bỏ log Disconnecting gây nhiễu nếu cần)
    };
  }, [isInitialized, loadNotifications, addNotification]);


  const dismissCall = () => setIncomingCall(null);

  return { incomingCall, dismissCall };
};
