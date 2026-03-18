"use client";
import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import LoadingCat from "@/components/LoadingCat";
import { roomService } from "@/services/roomService";
import { RoomType } from "@/enums/RoomType";

export interface ChatGroupBasicResponse {
  id: string;
  roomType: RoomType;
  createdAt: string;
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  memberCount: number;
}

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  avatar: string;
  online: boolean;
  unread?: number;
  timestamp: string;
  roomType?: "PRIVATE" | "GROUP";
  memberCount?: number;
}

function mapGroupToContact(group: ChatGroupBasicResponse): Contact {
  return {
    id: group.id,
    roomType: "GROUP",
    name: group.name ?? "Nhóm không tên",
    lastMessage: group.lastMessage ?? "",
    avatar: group.avatarUrl ?? "/group-avatar.png",
    online: false,
    unread: group.unreadCount || undefined,
    timestamp: group.lastMessageTime ?? group.createdAt,
    memberCount: group.memberCount,
  };
}

interface GroupListProps {
  selectedContact: Contact | null;
  isDarkMode: boolean;
  onSelectContact: (contact: Contact) => void;
}

export default function GroupList({
  selectedContact,
  isDarkMode,
  onSelectContact,
}: GroupListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true); // ✅ true từ đầu, không set trong effect

  useEffect(() => {
    let cancelled = false;
    roomService
      .getMyGroupRooms()
      .then((groups) => {
        if (cancelled) return;
        const mapped = (groups as unknown as ChatGroupBasicResponse[])
          .map(mapGroupToContact)
          .filter((c) => c.name && c.name !== "Unknown");
        setContacts(mapped);
      })
      .catch(() => {
        if (!cancelled) setContacts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingCat size="sm" isDark={isDarkMode} message="Đang tải nhóm..." />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Users
          className={`w-8 h-8 ${
            isDarkMode ? "text-gray-600" : "text-cyan-200"
          }`}
        />
        <p
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-cyan-500"
          }`}
        >
          Bạn chưa có nhóm nào
        </p>
      </div>
    );
  }

  return (
    <>
      {contacts.map((contact, index) => (
        <div
          key={`${contact.id}-${index}`}
          onClick={() => onSelectContact(contact)}
          className={`p-4 border-l-4 cursor-pointer transition-all duration-300 ${
            selectedContact?.id === contact.id
              ? isDarkMode
                ? "bg-gray-700 border-l-cyan-500"
                : "bg-gradient-to-r from-cyan-50 to-blue-50/40 border-l-cyan-500"
              : isDarkMode
              ? "border-l-transparent hover:bg-gray-700 hover:border-l-gray-600"
              : "border-l-transparent hover:bg-gradient-to-r hover:from-cyan-50/80 hover:to-blue-50/60 hover:border-l-cyan-300"
          }`}
          style={{
            animation: `slideInLeft 0.3s ease-out ${index * 0.05}s both`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={contact.avatar}
                alt={contact.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/group-avatar.png";
                }}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-100 shadow-md"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center shadow">
                <Users className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3
                  className={`font-semibold truncate ${
                    isDarkMode ? "text-gray-100" : "text-cyan-900"
                  }`}
                >
                  {contact.name}
                </h3>
                {contact.timestamp && (
                  <span
                    className={`text-xs ml-2 shrink-0 ${
                      isDarkMode ? "text-gray-400" : "text-cyan-600"
                    }`}
                  >
                    {new Date(contact.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              {contact.memberCount != null && (
                <p
                  className={`text-xs mb-0.5 ${
                    isDarkMode ? "text-cyan-500/70" : "text-cyan-500"
                  }`}
                >
                  {contact.memberCount} thành viên
                </p>
              )}
              <p
                className={`text-sm truncate ${
                  isDarkMode ? "text-gray-400" : "text-cyan-700"
                }`}
              >
                {contact.lastMessage || "Chưa có tin nhắn"}
              </p>
            </div>

            {contact.unread ? (
              <div className="shrink-0 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                {contact.unread}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </>
  );
}
