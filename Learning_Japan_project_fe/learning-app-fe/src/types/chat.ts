import { RoomType } from "@/enums/RoomType";

/* ================= REQUEST ================= */

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
