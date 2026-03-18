import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { getAccessTokenFromStorage } from "@/utils/jwt";

export type IncomingCallDTO = {
  type: "incoming";
  roomId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
};

export type NotificationSocketDTO = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export const connectNotificationSocket = (
  userId: string,
  onMessage: (data: NotificationSocketDTO) => void,
  onIncomingCall?: (data: IncomingCallDTO) => void
) => {
  const token = getAccessTokenFromStorage();

  // Kiểm tra URL an toàn
  const fallbackUrl = "http://localhost:8080/ws";
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || fallbackUrl;

  console.log(`🔌 Attempting WS connection to: ${wsUrl} for user: ${userId}`);

  const socket = new SockJS(wsUrl);


  const client = new Client({
    webSocketFactory: () => socket,

    reconnectDelay: 5000,
    debug: (str) => console.log("STOMP:", str),

    // ✅ Thêm Authorization header vào STOMP connect
    connectHeaders: token ? {
      Authorization: `Bearer ${token}`
    } : {},

    onConnect: (frame) => {
      console.log("🔔 WS connected | User:", userId, "| Frame:", frame.headers);

      // Subscribe notifications
      client.subscribe(
        `/topic/notifications/${userId}`,
        (message: IMessage) => {
          console.log("📩 NEW WS MESSAGE:", message.body);
          try {
            const data: NotificationSocketDTO = JSON.parse(message.body);
            onMessage(data);
          } catch (err) {
            console.error("❌ Parse notification error", err, message.body);
          }
        }
      );

      // Subscribe incoming call trên cùng connection
      client.subscribe(
        `/topic/call/incoming/${userId}`,
        (message: IMessage) => {
          console.log("📞 INCOMING CALL:", message.body);
          try {
            const data: IncomingCallDTO = JSON.parse(message.body);
            onIncomingCall?.(data);
          } catch (err) {
            console.error("❌ Parse incoming call error", err, message.body);
          }
        }
      );
    },

    onStompError: (frame) => {
      console.error("❌ Broker error:", frame.headers["message"]);
      console.error("Details:", frame.body);
    },

    onWebSocketClose: () => {
      console.warn("⚠️ WS disconnected");
    },
  });

  client.activate();

  return {
    disconnect: () => client.deactivate(),
  };
};

