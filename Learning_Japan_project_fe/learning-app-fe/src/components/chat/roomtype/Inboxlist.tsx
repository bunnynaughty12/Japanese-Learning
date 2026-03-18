"use client";
import React, { useEffect, useState } from "react";
import LoadingCat from "@/components/LoadingCat";
import {
  roomService,
  PrivateChatPreviewResponse,
} from "@/services/roomService";

interface Contact {
  id: string;
  otherUserId?: string; // 👈 thêm dòng này

  name: string;
  lastMessage: string;
  avatar: string;
  online: boolean;
  unread?: number;
  timestamp: string;
  roomType?: "PRIVATE" | "GROUP";
}

function mapPreviewToContact(p: PrivateChatPreviewResponse): Contact {
  return {
    id: p.roomId, // ← đổi từ p.userId sang p.roomId
    otherUserId: p.userId, // 👈 thêm dòng này
    name: p.fullName,
    lastMessage: p.lastMessage ?? "",
    avatar: p.avatarUrl ?? "/default-avatar.png",
    online: false,
    timestamp: p.lastMessageTime ?? "",
    roomType: "PRIVATE",
  };
}

interface InboxListProps {
  selectedContact: Contact | null;
  isDarkMode: boolean;
  onSelectContact: (contact: Contact) => void;
}

export default function InboxList({
  selectedContact,
  isDarkMode,
  onSelectContact,
}: InboxListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true); // true từ đầu, fetch ngay khi mount

  useEffect(() => {
    let cancelled = false;
    roomService
      .getMyChatUsers()
      .then((data) => {
        if (!cancelled) setContacts(data.map(mapPreviewToContact));
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
        <LoadingCat
          size="sm"
          isDark={isDarkMode}
          message="Đang tải danh bạ..."
        />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <p
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-cyan-500"
          }`}
        >
          Chưa có liên hệ
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
                  (e.target as HTMLImageElement).src = "/default-avatar.png";
                }}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-100 shadow-md"
              />
              {contact.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
              )}
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
