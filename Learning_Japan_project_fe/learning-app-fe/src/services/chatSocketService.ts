import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { CreateChatMessageRequest, ChatMessageResponse } from "@/types/chat";

class ChatSocketService {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  // =========================
  // 🔥 LẤY ACCESS TOKEN ĐÚNG CÁCH
  // =========================
  private getAccessToken(): string | null {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (!authStorage) return null;

      const parsed = JSON.parse(authStorage);
      return parsed?.state?.accessToken ?? null;
    } catch (error) {
      console.error("❌ Failed to parse auth-storage", error);
      return null;
    }
  }

  // Check if stompClient is active (used for debug)
  isActive(): boolean {
    return !!this.stompClient?.active;
  }

  // =========================
  // 🔌 CONNECT
  // =========================
  connect(onConnected?: () => void) {
    if (this.stompClient?.active) return;

    const token = this.getAccessToken();

    if (!token) {
      console.error("❌ No access token found in auth-storage");
      return;
    }

    const socket = new SockJS("http://localhost:8080/ws");

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => { }, // bật console.log nếu cần debug
    });

    this.stompClient.onConnect = () => {
      console.log("✅ WebSocket Connected");
      onConnected?.();
    };

    this.stompClient.onStompError = (frame) => {
      console.error("❌ STOMP Broker error:", frame.headers["message"]);
    };

    this.stompClient.onWebSocketClose = () => {
      console.warn("⚠ WebSocket closed");
    };

    this.stompClient.activate();
  }

  // =========================
  // 📩 SUBSCRIBE ROOM
  // =========================
  subscribeRoom(
    roomId: string,
    callback: (msg: ChatMessageResponse) => void
  ): StompSubscription | null {
    if (!this.stompClient?.connected) {
      console.warn("⚠ Cannot subscribe, WebSocket not connected");
      return null;
    }

    if (this.subscriptions.has(roomId)) {
      return this.subscriptions.get(roomId) || null;
    }

    const subscription = this.stompClient.subscribe(
      `/topic/room/${roomId}`,
      (message: IMessage) => {
        try {
          const data: ChatMessageResponse = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error("❌ Failed to parse message", error);
        }
      }
    );

    this.subscriptions.set(roomId, subscription);
    return subscription;
  }

  // =========================
  // ❌ UNSUBSCRIBE
  // =========================
  unsubscribeRoom(roomId: string) {
    const subscription = this.subscriptions.get(roomId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(roomId);
    }
  }

  // =========================
  // 📤 SEND MESSAGE
  // =========================
  sendMessage(body: CreateChatMessageRequest) {
    if (!this.stompClient?.connected) {
      console.warn("⚠ WebSocket not connected");
      return;
    }

    this.stompClient.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(body),
    });
  }

  // =========================
  // 🔌 DISCONNECT
  // =========================
  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }

    console.log("🔌 WebSocket Disconnected");
  }
}

export const chatSocketService = new ChatSocketService();
