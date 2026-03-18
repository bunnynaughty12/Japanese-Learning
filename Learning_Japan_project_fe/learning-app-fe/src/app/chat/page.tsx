"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useChatSocket } from "@/hooks/useChatSocket";
import { getUserIdFromToken } from "@/utils/jwt";
import { useDarkMode } from "@/hooks/useDarkMode";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import LoadingCat from "@/components/LoadingCat";
import ContactsList from "@/components/chat/Contactslist";
import ChatArea from "@/components/chat/Chatarea";
import { roomService } from "@/services/roomService";
import { useNotificationSync } from "@/hooks/useNotificationSync";
import { userService } from "@/services/userService";

// hoặc path của bạn
import { CallModal } from "@/components/chat/CallModal";
interface Contact {
  id: string; // = roomId
  name: string;
  lastMessage: string;
  avatar: string;
  online: boolean;
  unread?: number;
  timestamp: string;
  roomType?: "PRIVATE" | "GROUP";
}

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "🤙",
  "👏",
  "🙌",
  "💪",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🤎",
  "🖤",
  "🤍",
  "💔",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "💟",
  "✨",
  "🔥",
  "⚡",
  "💯",
  "✅",
  "❌",
  "🎉",
  "🎊",
  "🎈",
  "🎁",
  "🏆",
];

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactsTabKey, setContactsTabKey] = useState<string>("INBOX");
  const [message, setMessage] = useState("");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    file: File;
    preview: string;
    type: "image" | "file";
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId] = useState<string | null>(() => getUserIdFromToken());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
  const { incomingCall, dismissCall } = useNotificationSync();
  console.log("🔔 [ChatPage] incomingCall:", incomingCall);

  const {
    messages: socketMessages,
    isConnected,
    sendMessage: sendSocketMessage,
  } = useChatSocket(selectedContact?.id || null);

  // ── Xử lý roomId + shareMsg từ URL khi navigate từ ShareVideoModal ─────────

  useEffect(() => {
    if (!currentUserId) return;
    userService
      .getUserById(currentUserId)
      .then((profile) => {
        setCurrentUserName(profile.fullName);
        setCurrentUserAvatar(profile.avatarUrl ?? "");
      })
      .catch(console.error);
  }, [currentUserId]);

  useEffect(() => {
    const roomId = searchParams.get("roomId");
    const shareMsg = searchParams.get("shareMsg");

    if (!roomId) return;

    // Fill shareMsg vào input ngay
    if (shareMsg) {
      setMessage(decodeURIComponent(shareMsg));
    }

    // Tìm room info để set selectedContact
    async function resolveContact() {
      try {
        // Thử lấy từ cả private rooms lẫn group rooms
        const [roomsResult, groupsResult] = await Promise.allSettled([
          roomService.getMyRooms(),
          roomService.getMyGroupRooms(),
        ]);

        // Tìm trong group rooms trước để lấy đúng tên/avatar nhóm
        if (groupsResult.status === "fulfilled") {
          const group = groupsResult.value.find((g) => g.id === roomId);
          if (group) {
            setSelectedContact({
              id: group.id,
              name: group.name || "Unknown",
              lastMessage: group.lastMessage || "",
              avatar: group.avatarUrl || "/default-avatar.png",
              online: false,
              timestamp: group.lastMessageTime || "",
              roomType: "GROUP",
            });
            setContactsTabKey("GROUP");
            return; // đã tìm thấy, dừng
          }
        }

        // Fallback: tìm trong private rooms (chỉ lấy PRIVATE)
        if (roomsResult.status === "fulfilled") {
          const room = roomsResult.value.find(
            (r) => r.id === roomId && (r.roomType as string) !== "GROUP"
          );
          if (room) {
            setSelectedContact({
              id: room.id,
              name: room.otherUserName || room.name || "Unknown",
              lastMessage: room.lastMessage || "",
              avatar:
                room.otherUserAvatar || room.avatarUrl || "/default-avatar.png",
              online: false,
              timestamp: room.lastMessageTime || "",
              roomType: "PRIVATE",
            });
          }
        }
      } catch {
        // Nếu lỗi thì bỏ qua, user tự chọn contact
      }

      // Xóa params khỏi URL sau khi xử lý xong
      const params = new URLSearchParams(searchParams.toString());
      params.delete("roomId");
      params.delete("shareMsg");
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    }

    resolveContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần khi mount

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleSendMessage = () => {
    if (
      (!message.trim() && !attachmentPreview) ||
      !selectedContact ||
      !isConnected
    )
      return;
    if (message.trim()) sendSocketMessage(message.trim());
    setMessage("");
    setAttachmentPreview(null);
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setAttachmentPreview({
          file,
          preview: ev.target?.result as string,
          type: "image",
        });
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview({ file, preview: "", type: "file" });
    }
  };

  // ── Loading gate ───────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <LoadingCat
            size="xl"
            isDark={true}
            message="Đang tải"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className={`flex h-screen ${
          isDarkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
        }`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative z-0">
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          <div className="flex-1 flex overflow-hidden">
            <ContactsList
              key={contactsTabKey}
              selectedContact={selectedContact}
              isConnected={isConnected}
              searchQuery=""
              isDarkMode={isDarkMode}
              onSearchChange={() => {}}
              onSelectContact={handleSelectContact}
              initialTab={contactsTabKey as "INBOX" | "GROUP"}
            />
            {incomingCall && (
              <CallModal
                roomId={incomingCall.roomId}
                isCaller={false}
                currentUserId={currentUserId!}
                contactName={incomingCall.callerName}
                contactAvatar={incomingCall.callerAvatar}
                onClose={dismissCall}
              />
            )}
            <ChatArea
              selectedContact={selectedContact}
              currentUserId={currentUserId}
              message={message}
              isConnected={isConnected}
              currentUserName={currentUserName} // ✅ thêm
              currentUserAvatar={currentUserAvatar} // ✅ thêm
              isDarkMode={isDarkMode}
              showEmojiPicker={showEmojiPicker}
              attachmentPreview={attachmentPreview}
              emojis={EMOJIS}
              messagesEndRef={messagesEndRef}
              incomingMessages={socketMessages}
              onMessageChange={setMessage}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              onEmojiClick={handleEmojiClick}
              onToggleEmojiPicker={() => setShowEmojiPicker((v) => !v)}
              onFileSelect={handleFileSelect}
              onClearAttachment={() => setAttachmentPreview(null)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-gray-900 items-center justify-center">
          <LoadingCat
            size="xl"
            isDark={true}
            message="Đang tải"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
