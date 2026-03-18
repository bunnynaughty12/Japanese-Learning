"use client";
import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface IncomingCallData {
  roomId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
}

export const useIncomingCall = (currentUserId: string | null) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    console.log(
      "[useIncomingCall] useEffect fired, currentUserId:",
      currentUserId
    );
    if (!currentUserId) {
      console.warn("[useIncomingCall] currentUserId is null, aborting");
      return;
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    console.log("[useIncomingCall] Connecting to:", backendUrl);

    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
      reconnectDelay: 3000,

      onConnect: () => {
        const topic = `/topic/call/incoming/${currentUserId}`;
        console.log(
          "[useIncomingCall] ✅ STOMP connected, subscribing to:",
          topic
        );

        client.subscribe(topic, (message) => {
          console.log(
            "[useIncomingCall] 📞 Received incoming call:",
            message.body
          );
          const data = JSON.parse(message.body) as IncomingCallData;
          setIncomingCall(data);
        });
      },

      onDisconnect: () => {
        console.log("[useIncomingCall] 🔌 STOMP disconnected");
      },

      onStompError: (frame) => {
        console.error("[useIncomingCall] ❌ STOMP error:", frame);
      },

      onWebSocketError: (event) => {
        console.error("[useIncomingCall] ❌ WebSocket error:", event);
      },
    });

    clientRef.current = client;
    client.activate();
    console.log("[useIncomingCall] client.activate() called");

    return () => {
      console.log("[useIncomingCall] cleanup — deactivating client");
      client.deactivate();
    };
  }, [currentUserId]);

  const dismissCall = () => setIncomingCall(null);

  return { incomingCall, dismissCall };
};
