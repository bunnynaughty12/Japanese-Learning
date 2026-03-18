import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

export type FriendStatus =
    | "NONE"
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED";

export interface FriendStatusResponse {
    status: FriendStatus;
}
export interface FriendRequestResponse {
    requestId: string;

    senderId: string;
    senderName: string;
    senderAvatar: string;

    receiverId: string;
    receiverName: string;
    receiverAvatar: string;

    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
}
export const friendService = {
    /** A gửi lời mời kết bạn đến B */
    sendRequest(receiverId: string): Promise<{ status: "PENDING" }> {
        return http.post<{ status: "PENDING" }>(
            API_ENDPOINTS.FRIEND.SEND_REQUEST(receiverId)
        );
    },
    /** B chấp nhận lời mời */
    acceptRequest(friendshipId: string): Promise<void> {
        return http.post<void>(
            API_ENDPOINTS.FRIEND.ACCEPT(friendshipId)
        );
    },

    /** B từ chối lời mời */
    rejectRequest(friendshipId: string): Promise<void> {
        return http.post<void>(
            API_ENDPOINTS.FRIEND.REJECT(friendshipId)
        );
    },

    /** Hủy kết bạn */
    unfriend(friendshipId: string): Promise<void> {
        return http.delete<void>(
            API_ENDPOINTS.FRIEND.UNFRIEND(friendshipId)
        );
    },

    /** Lấy trạng thái quan hệ */
    getStatus(userId: string): Promise<FriendStatusResponse> {
        return http.get<FriendStatusResponse>(
            API_ENDPOINTS.FRIEND.GET_STATUS(userId)
        );
    },

    /** Lấy danh sách lời mời đang chờ */
    getPendingRequests(): Promise<FriendRequestResponse[]> {
        return http.get<FriendRequestResponse[]>(
            API_ENDPOINTS.FRIEND.GET_PENDING
        );
    },
};