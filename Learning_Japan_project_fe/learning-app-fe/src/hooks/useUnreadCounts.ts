"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ChatMessageResponse } from "@/types/chat";

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

/**
 * Subscribes to ALL provided roomIds simultaneously via a single STOMP connection.
 * Tracks unread message counts per room for messages NOT sent by currentUserId.
 * Call clearUnread(roomId) when the user opens that room.
 */
export function useUnreadCounts(
    roomIds: string[],
    currentUserId: string | number | null
): {
    unreadCounts: Record<string, number>;
    clearUnread: (roomId: string) => void;
    totalUnread: number;
} {
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const clientRef = useRef<Client | null>(null);
    const subsRef = useRef<Map<string, StompSubscription>>(new Map());
    const isConnectedRef = useRef(false);

    // Keep a stable ref to roomIds & currentUserId to avoid re-connecting
    const roomIdsRef = useRef<string[]>(roomIds);
    const currentUserIdRef = useRef(currentUserId);

    useEffect(() => {
        roomIdsRef.current = roomIds;
    }, [roomIds]);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    // ── Subscribe helper ────────────────────────────────────────────────────
    const subscribeToRooms = useCallback((client: Client, ids: string[]) => {
        // Unsubscribe rooms no longer needed
        subsRef.current.forEach((sub, id) => {
            if (!ids.includes(id)) {
                sub.unsubscribe();
                subsRef.current.delete(id);
            }
        });

        // Subscribe to new rooms
        ids.forEach((roomId) => {
            if (subsRef.current.has(roomId)) return;
            const sub = client.subscribe(`/topic/room/${roomId}`, (frame) => {
                try {
                    const msg: ChatMessageResponse = JSON.parse(frame.body);
                    if (String(msg.senderId) !== String(currentUserIdRef.current)) {
                        setUnreadCounts((prev) => ({
                            ...prev,
                            [roomId]: (prev[roomId] ?? 0) + 1,
                        }));
                    }
                } catch {
                    // ignore malformed frames
                }
            });
            subsRef.current.set(roomId, sub);
        });
    }, []);

    // ── Connect once on mount ───────────────────────────────────────────────
    useEffect(() => {
        const token = getAccessToken();
        if (!token) return;

        const backendUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const client = new Client({
            webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                isConnectedRef.current = true;
                subscribeToRooms(client, roomIdsRef.current);
            },
            onDisconnect: () => {
                isConnectedRef.current = false;
                subsRef.current.clear();
            },
            onWebSocketClose: () => {
                isConnectedRef.current = false;
                subsRef.current.clear();
            },
        });

        clientRef.current = client;
        client.activate();

        return () => {
            subsRef.current.forEach((sub) => sub.unsubscribe());
            subsRef.current.clear();
            client.deactivate();
            clientRef.current = null;
            isConnectedRef.current = false;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Re-subscribe when roomIds list changes ─────────────────────────────
    useEffect(() => {
        const client = clientRef.current;
        if (!client || !isConnectedRef.current) return;
        subscribeToRooms(client, roomIds);
    }, [roomIds, subscribeToRooms]);

    // ── Clear unread for a specific room ───────────────────────────────────
    const clearUnread = useCallback((roomId: string) => {
        setUnreadCounts((prev) => {
            if (!prev[roomId]) return prev;
            const next = { ...prev };
            delete next[roomId];
            return next;
        });
    }, []);

    const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

    return { unreadCounts, clearUnread, totalUnread };
}
