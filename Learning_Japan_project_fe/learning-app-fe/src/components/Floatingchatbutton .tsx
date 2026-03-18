"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { getUserIdFromToken } from "@/utils/jwt";
import {
  roomService,
  PrivateChatPreviewResponse,
  ChatMessageResponse,
} from "@/services/roomService";
import { userService } from "@/services/userService";
import { CallModal } from "@/components/chat/CallModal";
import { useIncomingCall } from "@/hooks/Useincomingcall";
import { useNotificationStore } from "@/stores/notificationStore";

import {
  ChatContactDropdown,
  ChatMessageList,
  ChatInputBar,
} from "@/components/chat/floating";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isGroup?: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
}

type Tab = "GROUP" | "INBOX";

interface FloatingChatButtonProps {
  isDarkMode?: boolean;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function mapApiMsg(m: ChatMessageResponse): Message {
  return {
    id: m.id,
    text: m.content,
    senderId: String(m.senderId),
    senderName: m.senderName ?? undefined,
    timestamp: new Date(m.sentAt),
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FloatingChatButton({
  isDarkMode = false,
}: FloatingChatButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("GROUP");
  const [inboxContacts, setInboxContacts] = useState<Contact[]>([]);
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserAvatar, setCurrentUserAvatar] = useState("");
  const [senderNameMap, setSenderNameMap] = useState<Record<string, string>>({});
  const [senderAvatarMap, setSenderAvatarMap] = useState<Record<string, string>>({});
  const fetchingAvatars = useRef<Set<string>>(new Set());

  const hasFetchedInbox = useRef(false);
  const hasFetchedGroup = useRef(false);
  const currentUserId = getUserIdFromToken();

  // ── Collect all room IDs for unread tracking ─────────────────────────
  const allRoomIds = useMemo(
    () => [...inboxContacts, ...groupContacts].map((c) => c.id),
    [inboxContacts, groupContacts]
  );

  const { unreadCounts, clearUnread, totalUnread } = useUnreadCounts(
    allRoomIds,
    currentUserId
  );

  const { incomingCall, dismissCall } = useIncomingCall(
    currentUserId ? String(currentUserId) : null
  );

  // ── Load current user profile ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    userService
      .getUserById(currentUserId)
      .then((profile) => {
        setCurrentUserName(profile.fullName);
        setCurrentUserAvatar(profile.avatarUrl || profile.avatar || "/default-avatar.png");
      })
      .catch(console.error);
  }, [currentUserId]);

  // ── Socket ───────────────────────────────────────────────────────────────
  const { messages: socketMessages, isConnected, sendMessage, sendToRoom } = useChatSocket(
    selectedContact?.id || null
  );

  // ── Track socket message length for dedup only ───────────────────────
  const prevSocketLengthRef = useRef(0);
  useEffect(() => {
    prevSocketLengthRef.current = socketMessages.length;
  }, [socketMessages]);

  // ── Memoize to avoid unnecessary re-renders ─────────────────────────────
  const socketMapped = useMemo(
    () => socketMessages.map(mapApiMsg),
    [socketMessages]
  );
  const messages = useMemo(() => {
    const historyIds = new Set(historyMessages.map((m) => m.id));
    return [
      ...historyMessages,
      ...socketMapped.filter((m) => !historyIds.has(m.id)),
    ];
  }, [historyMessages, socketMapped]);

  // ── Fetch sender avatar (group only) ─────────────────────────────────────
  const fetchSenderAvatar = useCallback(
    (senderId: string) => {
      if (
        !senderId ||
        senderId === String(currentUserId) ||
        senderAvatarMap[senderId] ||
        fetchingAvatars.current.has(senderId)
      )
        return;
      fetchingAvatars.current.add(senderId);
      userService
        .getUserById(senderId)
        .then((profile) => {
          setSenderAvatarMap((prev) => ({
            ...prev,
            [senderId]: profile.avatarUrl || profile.avatar || "/default-avatar.png",
          }));
          if (profile.fullName) {
            setSenderNameMap((prev) =>
              prev[senderId] ? prev : { ...prev, [senderId]: profile.fullName }
            );
          }
        })
        .catch(() => { });
    },
    [currentUserId, senderAvatarMap]
  );

  useEffect(() => {
    if (!selectedContact?.isGroup) return;
    messages.forEach((msg) => {
      if (String(msg.senderId) !== String(currentUserId)) {
        fetchSenderAvatar(msg.senderId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, selectedContact?.id]);

  // ── Fetch inbox ──────────────────────────────────────────────────────────
  const fetchInbox = useCallback(async (isManual = false) => {
    if (!isOpen && !isManual) return;
    if (hasFetchedInbox.current && !isManual) return;

    let cancelled = false;
    setIsLoadingContacts(true);
    try {
      const data: PrivateChatPreviewResponse[] =
        await roomService.getMyChatUsers();
      if (cancelled) return [];
      const mapped: Contact[] = data.map((p) => ({
        id: p.roomId,
        userId: p.userId,
        name: p.fullName,
        avatar: p.avatarUrl || p.avatar || "/default-avatar.png",
        lastMessage: p.lastMessage ?? "",
        timestamp: p.lastMessageTime ?? "",
        isGroup: false,
      }));
      setInboxContacts(mapped);
      hasFetchedInbox.current = true;
      return mapped;
    } catch {
      if (!cancelled) setInboxContacts([]);
      return [];
    } finally {
      if (!cancelled) setIsLoadingContacts(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // ── Real-time Inbox Refresh ──────────────────────────────────────────
  const { notifications } = useNotificationStore();
  const prevNotifCount = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > prevNotifCount.current) {
      const latest = notifications[0];
      const isFriendAcceptance =
        latest.title.toLowerCase().includes("kết bạn") ||
        latest.title.toLowerCase().includes("chấp nhận") ||
        latest.title.toLowerCase().includes("friend");

      if (isFriendAcceptance) {
        fetchInbox(true);
      }
    }
    prevNotifCount.current = notifications.length;
  }, [notifications.length, fetchInbox]);

  // Listen for manual acceptance events or routing
  useEffect(() => {
    const handleRefresh = () => {
      fetchInbox(true);
    };

    const handleOpenRoom = async (e: any) => {
      const { roomId, userId } = e.detail;

      setIsOpen(true);
      setActiveTab("INBOX");

      // 1. Fetch current inbox to ensure the room exists in local state
      const mapped = await fetchInbox(true);

      // 2. Select the room
      if (Array.isArray(mapped)) {
        const target = mapped.find((c: Contact) => c.id === roomId);
        if (target) {
          setSelectedContact(target);
          clearUnread(roomId);
        }
      }
    };

    const handleSendToRoom = (e: any) => {
      const { roomId, content } = e.detail;
      if (roomId && content) {
        sendToRoom(roomId, content);
      }
    };

    window.addEventListener("refresh-inbox", handleRefresh);
    window.addEventListener("chat-open-room", handleOpenRoom);
    window.addEventListener("chat-send-to-room", handleSendToRoom);
    return () => {
      window.removeEventListener("refresh-inbox", handleRefresh);
      window.removeEventListener("chat-open-room", handleOpenRoom);
      window.removeEventListener("chat-send-to-room", handleSendToRoom);
    };
  }, [fetchInbox, clearUnread, sendToRoom]);

  // ── Fetch groups ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || hasFetchedGroup.current) return;
    hasFetchedGroup.current = true;
    let cancelled = false;
    async function run() {
      try {
        const data = await roomService.getMyGroupRooms();
        if (cancelled) return;
        const mapped = data.map((g) => ({
          id: g.id,
          name: g.name ?? "Nhóm không tên",
          avatar: g.avatarUrl || g.avatar || "/group-avatar.png",
          lastMessage: g.lastMessage ?? "",
          timestamp: g.lastMessageTime ?? g.createdAt ?? "",
          isGroup: true,
        }));
        setGroupContacts(mapped);
        if (mapped.length > 0) setSelectedContact(mapped[0]);
      } catch {
        if (!cancelled) setGroupContacts([]);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [isOpen]);

  // ── Fetch message history ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedContact?.id) {
      setHistoryMessages([]);
      return;
    }
    let cancelled = false;
    setHistoryMessages([]);
    setIsLoadingMessages(true);
    fetchingAvatars.current = new Set();
    setSenderAvatarMap({});
    async function run() {
      try {
        const page = await roomService.getMessages(selectedContact!.id, 0, 50);
        if (cancelled) return;
        const history = [...(page.content ?? [])].reverse().map(mapApiMsg);
        setHistoryMessages(history);
        const nameMap: Record<string, string> = {};
        (page.content ?? []).forEach((m: ChatMessageResponse) => {
          if (m.senderId && m.senderName) {
            nameMap[String(m.senderId)] = m.senderName;
          }
        });
        setSenderNameMap((prev) => ({ ...prev, ...nameMap }));
      } catch {
        if (!cancelled) setHistoryMessages([]);
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [selectedContact?.id]);

  // ── Reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      hasFetchedInbox.current = false;
      hasFetchedGroup.current = false;
      fetchingAvatars.current = new Set();
      setSelectedContact(null);
      setHistoryMessages([]);
      setActiveTab("GROUP");
      setInputMessage("");
      setSenderNameMap({});
      setSenderAvatarMap({});
    }
  }, [isOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!inputMessage.trim() || !isConnected || !selectedContact) return;
    sendMessage(inputMessage.trim());
    setInputMessage("");
  }, [inputMessage, isConnected, selectedContact, sendMessage]);

  const handleSelectContact = (c: Contact) => {
    setSelectedContact(c);
    setShowContactDropdown(false);
    clearUnread(c.id);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const list = tab === "INBOX" ? inboxContacts : groupContacts;
    setSelectedContact(list.length > 0 ? list[0] : null);
  };

  const currentContacts =
    activeTab === "INBOX" ? inboxContacts : groupContacts;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-20 right-5 z-[9998]">
      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`absolute bottom-16 right-0 w-85 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border flex flex-col overflow-hidden animate-slide-up ${isDarkMode
            ? "bg-[#0f172a] border-gray-800 shadow-cyan-900/20"
            : "bg-white border-cyan-100"
            }`}
          style={{ height: "550px", width: "340px" }}
        >
          {/* Header / Contact Dropdown */}
          <ChatContactDropdown
            isDarkMode={isDarkMode}
            selectedContact={selectedContact}
            showContactDropdown={showContactDropdown}
            setShowContactDropdown={setShowContactDropdown}
            currentContacts={currentContacts}
            activeTab={activeTab}
            isLoadingContacts={isLoadingContacts}
            onSelectContact={handleSelectContact}
            onTabChange={handleTabChange}
            onCall={() => setShowCall(true)}
            onClose={() => setIsOpen(false)}
            showCallButton={!!selectedContact && !!currentUserId && activeTab !== "GROUP"}
            unreadCounts={unreadCounts}
          />

          {/* Messages */}
          <ChatMessageList
            isDarkMode={isDarkMode}
            messages={messages}
            currentUserId={currentUserId}
            selectedContact={selectedContact}
            isLoadingContacts={isLoadingContacts}
            isLoadingMessages={isLoadingMessages}
            senderNameMap={senderNameMap}
            senderAvatarMap={senderAvatarMap}
            onNavigate={(path) => {
              setIsOpen(false);
              router.push(path);
            }}
          />

          {/* Input */}
          <ChatInputBar
            isDarkMode={isDarkMode}
            inputMessage={inputMessage}
            isConnected={isConnected}
            selectedContactId={selectedContact?.id ?? null}
            onChange={setInputMessage}
            onSend={handleSend}
          />
        </div>
      )}

      {/* ── CallModal (caller) ───────────────────────────────────────────── */}
      {showCall && selectedContact && currentUserId && (
        <CallModal
          roomId={`call-${currentUserId}-${selectedContact.userId ?? selectedContact.id}`}
          isCaller={true}
          currentUserId={String(currentUserId)}
          receiverId={selectedContact.userId ?? selectedContact.id}
          contactName={selectedContact.name}
          contactAvatar={selectedContact.avatar}
          callerName={currentUserName}
          callerAvatar={currentUserAvatar}
          isDarkMode={isDarkMode}
          onClose={() => setShowCall(false)}
        />
      )}

      {/* ── CallModal (receiver / incoming) ─────────────────────────────── */}
      {incomingCall && currentUserId && (
        <CallModal
          roomId={incomingCall.roomId}
          isCaller={false}
          currentUserId={String(currentUserId)}
          contactName={incomingCall.callerName}
          contactAvatar={incomingCall.callerAvatar}
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          isDarkMode={isDarkMode}
          onClose={() => dismissCall()}
        />
      )}

      {/* ── Floating Button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative transition-all duration-300 hover:scale-110"
        title="Chat Room"
      >
        <div className={`absolute inset-0 rounded-full opacity-20 animate-ping ${isDarkMode ? "bg-cyan-400" : "bg-purple-400"
          }`} />
        <div className="relative w-11 h-11 drop-shadow-2xl animate-bounce-slow">
          <img
            src="/message.png"
            alt="Chat Room"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Unread badge (total across all rooms) */}
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md z-10 animate-pulse">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}

        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
          <div className={`${isDarkMode ? "bg-gray-800 text-cyan-400 border border-gray-700 shadow-cyan-900/40" : "bg-gray-900 text-white shadow-xl shadow-gray-200/50"
            } text-[11px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-xl whitespace-nowrap shadow-2xl relative`}>
            Phòng Chat
            <span className={`absolute left-full top-1/2 -translate-y-1/2 border-6 border-transparent ${isDarkMode ? "border-l-gray-800" : "border-l-gray-900"
              }`} />
          </div>
        </div>
      </button>

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.22s ease-out; }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }

        @keyframes bounce-send {
          0%, 100% { transform: translateY(0) scale(1); }
          30%      { transform: translateY(-5px) scale(1.08); }
          60%      { transform: translateY(0) scale(0.96); }
          80%      { transform: translateY(-2px) scale(1.03); }
        }
        .animate-bounce-send { animation: bounce-send 0.8s ease-in-out infinite; }

        .scrollbar-dark::-webkit-scrollbar        { width: 4px; }
        .scrollbar-dark::-webkit-scrollbar-track  { background: #111827; border-radius: 999px; }
        .scrollbar-dark::-webkit-scrollbar-thumb  { background: #374151; border-radius: 999px; }
        .scrollbar-dark::-webkit-scrollbar-thumb:hover { background: #4b5563; }

        .scrollbar-light::-webkit-scrollbar        { width: 4px; }
        .scrollbar-light::-webkit-scrollbar-track  { background: #f0fdfe; border-radius: 999px; }
        .scrollbar-light::-webkit-scrollbar-thumb  { background: #a5f3fc; border-radius: 999px; }
        .scrollbar-light::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
      `}</style>
    </div>
  );
}
