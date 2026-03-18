// src/services/roomService.ts
import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { RoomType } from "@/enums/RoomType";

export interface CreatePrivateRoomRequest {
  targetUserId: string;
}

export interface CreateChatMessageRequest {
  roomId: string;
  content: string;
}

/* ================= RESPONSE ================= */

export interface ChatMessageResponse {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  sentAt: string;
}
export interface PrivateChatPreviewResponse {
  userId: string;
  roomId: string;

  fullName: string;
  avatarUrl?: string;
  avatar?: string; // Add this

  lastMessage?: string;
  lastMessageTime?: string;
}
export interface ChatGroupBasicResponse {
  id: string;
  roomType: RoomType; // GROUP
  createdAt: string;

  name: string;
  avatarUrl?: string;
  avatar?: string; // Add this

  lastMessage?: string;
  lastMessageTime?: string;

  unreadCount: number;
  memberCount: number;
}
export interface ChatRoomResponse {
  id: string;
  roomType: RoomType; // PRIVATE | GROUP
  createdAt: string; // ISO string
  memberIds: string[];
  name: string; // ISO string
  avatarUrl: string; // ISO string

  // display
  otherUserName?: string;
  otherUserAvatar?: string;

  // last message
  lastMessage?: string;
  lastMessageTime?: string;

  unreadCount?: number;
}

/* ===================== TYPES ===================== */

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
export interface ChatUserResponse {
  userId: string;
  fullName: string;
  avatarUrl?: string;
}
export interface CreateGroupRoomRequest {
  name: string;
  avatar?: File; // 👈 file upload
  memberIds: string[];
}
export interface ChatGroupDetailResponse {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  memberCount: number;
  members: GroupMemberInfo[];
}

export interface UserChatResponse {
  id: string;
  fullName: string;
  avatarUrl?: string;
}
export interface GroupMemberInfo {
  userId: string;
  fullName: string;
  avatarUrl?: string;
}
/* ===================== SERVICE ===================== */

export const roomService = {
  /**
   * 👥 Lấy chi tiết group room theo roomId
   */
  getGroupDetail(roomId: string): Promise<ChatGroupDetailResponse> {
    return http.get<ChatGroupDetailResponse>(
      API_ENDPOINTS.CHAT_ROOM.GROUP_DETAIL(roomId)
    );
  },

  /**
   * Lấy danh sách phòng chat của user hiện tại
   */
  getMyRooms(): Promise<ChatRoomResponse[]> {
    return http.get<ChatRoomResponse[]>(API_ENDPOINTS.CHAT_ROOM.MY_ROOMS);
  },
  /**
   * 👥 Lấy tất cả GROUP room của user hiện tại
   */
  getMyGroupRooms(): Promise<ChatGroupBasicResponse[]> {
    return http.get<ChatGroupBasicResponse[]>(
      API_ENDPOINTS.CHAT_ROOM.MY_GROUP_ROOMS
    );
  },
  /**
   * 👥 Lấy tất cả user khác mà mình đã từng chat chung room
   */
  getMyChatUsers(): Promise<PrivateChatPreviewResponse[]> {
    return http.get<PrivateChatPreviewResponse[]>(
      API_ENDPOINTS.CHAT_ROOM.MY_USERS
    );
  },
  /**
   * Tạo phòng chat private
   */
  createPrivateRoom(
    request: CreatePrivateRoomRequest
  ): Promise<ChatRoomResponse> {
    return http.post<ChatRoomResponse>(
      API_ENDPOINTS.CHAT_ROOM.CREATE_PRIVATE,
      request
    );
  },
  createGroupRoom(request: CreateGroupRoomRequest): Promise<ChatRoomResponse> {
    const formData = new FormData();

    formData.append("name", request.name);

    request.memberIds.forEach((id) => {
      formData.append("memberIds", id);
    });

    if (request.avatar) {
      formData.append("avatar", request.avatar);
    }

    return http.post<ChatRoomResponse>(
      API_ENDPOINTS.CHAT_ROOM.CREATE_GROUP,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
  /**
   * 🔍 Search phòng chat theo tên người đã chat
   */
  searchRooms(keyword: string): Promise<ChatRoomResponse[]> {
    return http.get<ChatRoomResponse[]>(
      API_ENDPOINTS.CHAT_ROOM.SEARCH(keyword)
    );
  },
  /**
   * Lấy lịch sử tin nhắn của phòng chat
   */
  getMessages(
    roomId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ChatMessageResponse>> {
    return http.get<PageResponse<ChatMessageResponse>>(
      API_ENDPOINTS.CHAT_ROOM.MESSAGES(roomId, page, size)
    );
  },
};
