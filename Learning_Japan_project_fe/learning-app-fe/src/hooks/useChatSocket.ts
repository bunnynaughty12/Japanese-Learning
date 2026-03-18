"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ChatMessageResponse } from "@/types/chat";

interface UseChatSocketReturn {
  messages: ChatMessageResponse[];
  isConnected: boolean;
  sendMessage: (content: string) => void;
  sendToRoom: (roomId: string, content: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageResponse[]>>;
}

function getAccessToken(): string | null {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return null;
    const parsed = JSON.parse(authStorage);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/** Ensure every incoming WebSocket message has an `id` (backend may omit it) */
function normalizeMessage(raw: ChatMessageResponse): ChatMessageResponse {
  return {
    ...raw,
    id: raw.id ?? `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sentAt: raw.sentAt ?? new Date().toISOString(),
  };
}

/**
 * Self-contained STOMP hook – owns its own Client instance.
 * Mirrors the pattern used by useIncomingCall to avoid singleton race conditions.
 */
export const useChatSocket = (roomId: string | null): UseChatSocketReturn => {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subRef = useRef<StompSubscription | null>(null);

  // ── Connect once on mount ──────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      console.error("[ChatSocket] No access token – cannot connect");
      return;
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("[ChatSocket] ✅ Connected to STOMP server");
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log("[ChatSocket] ❌ Disconnected from STOMP server");
        setIsConnected(false);
      },
      onWebSocketClose: () => setIsConnected(false),
      onStompError: (frame) =>
        console.error("[ChatSocket] STOMP error:", frame.headers["message"]),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      subRef.current?.unsubscribe();
      subRef.current = null;
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, []);

  // ── Subscribe / resubscribe when room or connection changes ──────────
  useEffect(() => {
    const client = clientRef.current;

    // Always clean up previous subscription
    subRef.current?.unsubscribe();
    subRef.current = null;

    if (!roomId || !isConnected || !client?.connected) return;

    subRef.current = client.subscribe(
      `/topic/room/${roomId}`,
      (message) => {
        try {
          const raw: ChatMessageResponse = JSON.parse(message.body);
          const normalized = normalizeMessage(raw);
          setMessages((prev) => [...prev, normalized]);
        } catch (error) {
          console.error("[ChatSocket] Failed to parse message:", error);
        }
      }
    );

    return () => {
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, [roomId, isConnected]);

  // ── Send message ────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      const client = clientRef.current;
      if (!roomId || !content.trim() || !client?.connected) return;

      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ roomId, content: content.trim() }),
      });
    },
    [roomId]
  );

  const sendToRoom = useCallback((roomId: string, content: string) => {
    const client = clientRef.current;
    if (!client?.connected || !roomId) return;

    client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ roomId, content: content.trim() }),
    });
  }, []);

  return { messages, isConnected, sendMessage, sendToRoom, setMessages };
};
