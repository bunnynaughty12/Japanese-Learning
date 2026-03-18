"use client";

import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import NotificationDropdown from "./NotificationDropdown";
import { useNotificationStore } from "@/stores/notificationStore";
import { useNotificationSync } from "@/hooks/useNotificationSync";
import { useFriendRequest } from "@/hooks/useFriendRequest";
import FriendRequestToast from "@/components/chat/FriendRequestToast";
import { getUserIdFromToken } from "@/utils/jwt";
import NotificationToast from "./notification";

type Props = {
  isDarkMode?: boolean;
};

export default function NotificationBell({ isDarkMode = false }: Props) {
  // ✅ Tự động sync DB + WebSocket
  useNotificationSync();

  // ✅ Lấy state từ store
  const {
    notifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = getUnreadCount();

  // ── Friend-request real-time ─────────────────────────────────────────
  const currentUserId = getUserIdFromToken();
  const { pendingRequests, dismissRequest } = useFriendRequest(
    currentUserId ? String(currentUserId) : null
  );

  const pendingRequest = pendingRequests[0]; // Show the most recent one as a toast
  const totalCount = unreadCount + pendingRequests.length;

  // ── Vocab reminder toast logic ──────────────────────────────────────
  const [vocabReminder, setVocabReminder] = useState<{ id: string; message: string } | null>(null);
  const showedVocabIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Tìm notification mới nhất có title ôn từ vựng và chưa đọc
    const latestVocab = notifications.find(n =>
      !n.isRead &&
      (n.title.includes("Nhắc ôn từ vựng") || n.title.includes("📚")) &&
      !showedVocabIds.current.has(n.id)
    );

    if (latestVocab) {
      setVocabReminder({ id: latestVocab.id, message: latestVocab.content });
      showedVocabIds.current.add(latestVocab.id);
    }
  }, [notifications]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative flex flex-col items-end gap-2" ref={dropdownRef}>
      {/* ── Friend request toast (hiện phía trên chuông) ────────────── */}
      {pendingRequest && (
        <div className="absolute bottom-full mb-2 right-0 z-[9999]">
          <FriendRequestToast
            request={pendingRequest}
            isDarkMode={isDarkMode}
            onDismiss={() => dismissRequest(pendingRequest.requestId)}
          />
        </div>
      )}

      {/* ── Vocabulary reminder toast (hiện góc trên phải) ─────────── */}
      {vocabReminder && (
        <NotificationToast
          type="warning"
          message={vocabReminder.message}
          onClose={() => setVocabReminder(null)}
        />
      )}

      {/* ── Notification bell button ─────────────────────────────────── */}
      <button
        className={`relative p-1.5 rounded-lg transition-all ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          } ${isOpen ? (isDarkMode ? "bg-gray-700" : "bg-gray-100") : ""}`}
        title="Thông báo"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell
          className={`w-5 h-5 transition-colors ${isDarkMode
            ? "text-gray-300 hover:text-white"
            : "text-gray-600 hover:text-gray-900"
            }`}
        />

        {/* Unread badge */}
        {totalCount > 0 && (
          <span
            className={`
              absolute -top-1 -right-1
              bg-red-500 text-white text-[10px] font-semibold
              min-w-[18px] h-[18px] rounded-full
              flex items-center justify-center
              animate-pulse
              border-2
              ${isDarkMode ? "border-gray-800" : "border-white"}
            `}
          >
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          pendingFriendRequests={pendingRequests}
          isDarkMode={isDarkMode}
          onClose={() => setIsOpen(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onDismissFriendRequest={dismissRequest}
        />
      )}
    </div>
  );
}
