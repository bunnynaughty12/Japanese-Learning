"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Send, Search, Check, Users, User } from "lucide-react";
import {
  roomService,
  ChatUserResponse,
  ChatGroupBasicResponse,
  PrivateChatPreviewResponse,
} from "@/services/roomService";

interface ShareVideoModalProps {
  videoId: string;
  videoTitle: string;
  isDarkMode?: boolean;
  onClose: () => void;
}

type RecipientType = "user" | "group";

interface Recipient {
  id: string; // userId or groupId (roomId)
  name: string;
  avatarUrl?: string;
  type: RecipientType;
  roomId?: string; // for groups, roomId is already known
}

export default function ShareVideoModal({
  videoId,
  videoTitle,
  isDarkMode = false,
  onClose,
}: ShareVideoModalProps) {
  const router = useRouter();
  const [users, setUsers] = useState<PrivateChatPreviewResponse[]>([]);
  const [groups, setGroups] = useState<ChatGroupBasicResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "groups">("all");
  const modalRef = useRef<HTMLDivElement>(null);

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Build unified recipient list
  const allRecipients = useMemo<Recipient[]>(() => {
    const userRecipients: Recipient[] = users.map((u) => ({
      id: u.userId,
      name: u.fullName,
      avatarUrl: u.avatarUrl,
      type: "user",
      roomId: u.roomId,
    }));
    const groupRecipients: Recipient[] = groups.map((g) => ({
      id: g.id,
      name: g.name,
      avatarUrl: g.avatarUrl,
      type: "group",
      roomId: g.id,
    }));
    return [...userRecipients, ...groupRecipients];
  }, [users, groups]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = allRecipients;
    if (activeTab === "users") list = list.filter((r) => r.type === "user");
    if (activeTab === "groups") list = list.filter((r) => r.type === "group");
    return q ? list.filter((r) => r.name.toLowerCase().includes(q)) : list;
  }, [searchQuery, allRecipients, activeTab]);

  useEffect(() => {
    Promise.allSettled([
      roomService.getMyChatUsers(),
      roomService.getMyGroupRooms(),
    ]).then(([usersResult, groupsResult]) => {
      if (usersResult.status === "fulfilled") setUsers(usersResult.value);
      if (groupsResult.status === "fulfilled") setGroups(groupsResult.value);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);

    const shareMsg = encodeURIComponent(`🎬 ${videoTitle}\n${videoUrl}`);
    const selectedIds = Array.from(selected);

    // Separate users and groups
    const selectedRecipients = allRecipients.filter((r) =>
      selectedIds.includes(r.id)
    );

    try {
      const shareText = `🎬 ${videoTitle}\n/video/${videoId}\n${videoUrl}`;
      let firstRoomId: string | undefined;

      // Send to all selected recipients
      await Promise.all(
        selectedRecipients.map(async (r) => {
          let roomId = r.roomId;
          if (!roomId && r.type === "user") {
            const room = await roomService.createPrivateRoom({
              targetUserId: r.id,
            });
            roomId = room.id;
          }

          if (roomId) {
            if (!firstRoomId) firstRoomId = roomId;
            // Dispatch event to send via WebSocket (FloatingChatButton listens to this)
            window.dispatchEvent(
              new CustomEvent("chat-send-to-room", {
                detail: {
                  roomId: roomId,
                  content: shareText,
                },
              })
            );
          }
        })
      );

      setSentTo(new Set(selectedIds));
      setSending(false);
      onClose();

      if (firstRoomId) {
        window.dispatchEvent(
          new CustomEvent("chat-open-room", {
            detail: {
              roomId: firstRoomId,
            },
          })
        );
      }
    } catch (err) {
      console.error("Failed to share video:", err);
      setSending(false);
    }
  };

  const allSent = sentTo.size > 0 && sentTo.size === selected.size;

  const tabClass = (tab: typeof activeTab) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab
      ? isDarkMode
        ? "bg-cyan-600 text-white"
        : "bg-cyan-500 text-white"
      : isDarkMode
        ? "text-gray-400 hover:bg-gray-700"
        : "text-gray-500 hover:bg-gray-100"
    }`;

  // Scrollbar styles that change with isDarkMode
  const scrollbarStyles = isDarkMode
    ? `
      .share-list::-webkit-scrollbar { width: 6px; }
      .share-list::-webkit-scrollbar-track { background: #374151; border-radius: 999px; }
      .share-list::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 999px; }
      .share-list::-webkit-scrollbar-thumb:hover { background: #6b7280; }
    `
    : `
      .share-list::-webkit-scrollbar { width: 6px; }
      .share-list::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 999px; }
      .share-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
      .share-list::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
    `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <style>{scrollbarStyles}</style>
      <div
        ref={modalRef}
        className={`w-[520px] rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-5 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
        >
          <h3
            className={`font-semibold text-base ${isDarkMode ? "text-gray-100" : "text-gray-800"
              }`}
          >
            Chia sẻ video
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
          >
            <X
              className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
            />
          </button>
        </div>

        {/* Video preview */}
        <div
          className={`mx-5 mt-5 px-4 py-3 rounded-xl flex items-center gap-3 ${isDarkMode ? "bg-gray-700/60" : "bg-gray-50 border border-gray-200"
            }`}
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
            alt="thumb"
            className="w-14 h-10 rounded object-cover shrink-0"
          />
          <p
            className={`text-xs font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
          >
            {videoTitle || videoUrl}
          </p>
        </div>

        {/* Search */}
        <div className="px-5 mt-4">
          <div
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm ${isDarkMode
              ? "bg-gray-700 border-gray-600 text-gray-100"
              : "bg-gray-50 border-gray-200 text-gray-800"
              }`}
          >
            <Search
              className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-gray-400" : "text-gray-400"
                }`}
            />
            <input
              type="text"
              placeholder="Tìm người hoặc nhóm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 mt-3 flex gap-1.5">
          <button
            className={tabClass("all")}
            onClick={() => setActiveTab("all")}
          >
            Tất cả
          </button>
          <button
            className={tabClass("users")}
            onClick={() => setActiveTab("users")}
          >
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Cá nhân
            </span>
          </button>
          <button
            className={tabClass("groups")}
            onClick={() => setActiveTab("groups")}
          >
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Nhóm
            </span>
          </button>
        </div>

        {/* User/Group list */}
        <div className="px-3 mt-3 max-h-64 overflow-y-auto share-list">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p
              className={`text-center text-xs py-10 ${isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
            >
              Không tìm thấy kết quả
            </p>
          ) : (
            filtered.map((recipient) => {
              const isSelected = selected.has(recipient.id);
              const isSent = sentTo.has(recipient.id);
              return (
                <button
                  key={`${recipient.type}-${recipient.id}`}
                  onClick={() => toggleSelect(recipient.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${isSelected
                    ? isDarkMode
                      ? "bg-cyan-900/30"
                      : "bg-cyan-50"
                    : isDarkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-50"
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={recipient.avatarUrl || "/default-avatar.png"}
                      alt={recipient.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {/* Group badge */}
                    {recipient.type === "group" && (
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-white"
                          }`}
                      >
                        <Users
                          className={`w-2.5 h-2.5 ${isDarkMode ? "text-cyan-400" : "text-cyan-500"
                            }`}
                        />
                      </span>
                    )}
                  </div>

                  {/* Name + type hint */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                    >
                      {recipient.name}
                    </p>
                    {recipient.type === "group" && (
                      <p
                        className={`text-xs truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                      >
                        Nhóm
                      </p>
                    )}
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSent
                      ? "bg-emerald-500 border-emerald-500"
                      : isSelected
                        ? "bg-cyan-500 border-cyan-500"
                        : isDarkMode
                          ? "border-gray-500"
                          : "border-gray-300"
                      }`}
                  >
                    {(isSelected || isSent) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-5 mt-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
        >
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending || allSent}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${allSent
              ? "bg-emerald-500 text-white"
              : selected.size === 0
                ? isDarkMode
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg"
              }`}
          >
            {allSent ? (
              <>
                <Check className="w-4 h-4" /> Đã gửi!
              </>
            ) : sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Gửi
                {selected.size > 0 ? ` (${selected.size})` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}