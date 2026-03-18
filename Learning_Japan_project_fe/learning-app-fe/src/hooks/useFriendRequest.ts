"use client";
import { useEffect, useRef, useState } from "react";
import { Client, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { friendService, FriendRequestResponse } from "@/services/friendService";

function getAccessToken(): string | null {
    try {
        const s = localStorage.getItem("auth-storage");
        return s ? (JSON.parse(s)?.state?.accessToken ?? null) : null;
    } catch {
        return null;
    }
}

/**
 * Subscribes to /topic/friend-request/{userId} via STOMP.
 * Delivers incoming friend request payloads to the caller in real-time.
 */
export function useFriendRequest(currentUserId: string | null) {
    const [pendingRequests, setPendingRequests] = useState<FriendRequestResponse[]>([]);
    const clientRef = useRef<Client | null>(null);

    // 1. Fetch existing pending requests on mount
    useEffect(() => {
        if (!currentUserId) return;
        friendService.getPendingRequests()
            .then(requests => {
                setPendingRequests(requests);
            })
            .catch(err => console.error("Failed to fetch pending friend requests:", err));
    }, [currentUserId]);

    // 2. Real-time subscription
    useEffect(() => {
        if (!currentUserId) return;

        const token = getAccessToken();
        if (!token) return;

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const client = new Client({
            webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
            reconnectDelay: 5000,
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe(
                    `/topic/friend-request/${currentUserId}`,
                    (frame: IFrame) => {
                        try {
                            const data: FriendRequestResponse = JSON.parse(frame.body);
                            // Add new request to the list if not already there
                            setPendingRequests((prev: FriendRequestResponse[]) => {
                                if (prev.some(r => r.requestId === data.requestId)) return prev;
                                return [data, ...prev];
                            });
                        } catch {
                            // ignore
                        }
                    }
                );
            },
        });

        clientRef.current = client;
        client.activate();

        return () => {
            client.deactivate();
            clientRef.current = null;
        };
    }, [currentUserId]);

    const dismissRequest = (requestId: string) => {
        setPendingRequests((prev: FriendRequestResponse[]) => prev.filter(r => r.requestId !== requestId));
    };

    return {
        pendingRequests,
        dismissRequest,
        pendingRequest: pendingRequests[0] || null // For backward compatibility if needed
    };
}
