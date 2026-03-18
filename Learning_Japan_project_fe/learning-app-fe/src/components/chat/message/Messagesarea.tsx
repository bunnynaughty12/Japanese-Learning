"use client";
import React, { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, File, Loader2 } from "lucide-react";
import {
  roomService,
  ChatMessageResponse,
  GroupMemberInfo,
} from "@/services/roomService";

const YT_REGEX =
  /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)|https?:\/\/youtu\.be\/([\w-]+)/g;

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1] : null;
}

function MessageContent({
  text,
  isDarkMode,
  isMe,
}: {
  text: string;
  isDarkMode: boolean;
  isMe: boolean;
}) {
  const router = useRouter();
  const ytMatches = Array.from(new Set(text.match(YT_REGEX) || []));

  if (ytMatches.length === 0) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
    );
  }

  const plainText = text.replace(YT_REGEX, "").trim();
  return (
    <div className="space-y-2">
      {plainText && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {plainText}
        </p>
      )}
      {ytMatches.map((url) => {
        const videoId = extractYoutubeId(url);
        if (!videoId) return null;
        const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        return (
          <button
            key={url}
            onClick={() => router.push(`/video/${videoId}`)}
            className={`w-full text-left rounded-xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-lg ${
              isMe
                ? "border-white/20 bg-white/10"
                : isDarkMode
                ? "border-gray-600 bg-gray-700"
                : "border-cyan-200 bg-cyan-50"
            }`}
          >
            <div className="relative">
              <img
                src={thumb}
                alt="video"
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>
            <div
              className={`px-3 py-2 text-xs font-medium truncate ${
                isMe
                  ? "text-white/90"
                  : isDarkMode
                  ? "text-gray-200"
                  : "text-cyan-800"
              }`}
            >
              {url}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  attachment?: { type: "image" | "file"; url: string; name?: string };
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
}

interface State {
  messages: Message[];
  isLoading: boolean;
}

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Message[] }
  | { type: "FETCH_ERROR" }
  | { type: "APPEND"; payload: Message };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { messages: [], isLoading: true };
    case "FETCH_SUCCESS":
      return { messages: action.payload, isLoading: false };
    case "FETCH_ERROR":
      return { messages: [], isLoading: false };
    case "APPEND":
      if (state.messages.some((m) => m.id === action.payload.id)) return state;
      return { ...state, messages: [...state.messages, action.payload] };
    default:
      return state;
  }
}

const normalizeId = (id: string | number | null | undefined): string =>
  String(id || "").trim();

function mapApiMessage(m: ChatMessageResponse): Message {
  return {
    id: m.id,
    text: m.content,
    senderId: normalizeId(m.senderId),
    timestamp: new Date(m.sentAt),
  };
}

interface MessagesAreaProps {
  selectedContact: Contact;
  currentUserId: string | null;
  isDarkMode: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  incomingMessages?: ChatMessageResponse[];
  groupMembers?: GroupMemberInfo[];
}

export default function MessagesArea({
  selectedContact,
  currentUserId,
  isDarkMode,
  messagesEndRef,
  incomingMessages = [],
  groupMembers = [],
}: MessagesAreaProps) {
  const [{ messages, isLoading }, dispatch] = useReducer(reducer, {
    messages: [],
    isLoading: true,
  });

  const memberMap = React.useMemo(() => {
    const map = new Map<string, GroupMemberInfo>();
    groupMembers.forEach((m) => map.set(m.userId, m));
    return map;
  }, [groupMembers]);

  const isGroup = selectedContact.roomType === "GROUP";

  useEffect(() => {
    let cancelled = false;
    async function fetchMessages() {
      dispatch({ type: "FETCH_START" });
      try {
        const pageData = await roomService.getMessages(selectedContact.id);
        if (cancelled) return;
        const history = [...(pageData.content || [])]
          .reverse()
          .map(mapApiMessage);
        dispatch({ type: "FETCH_SUCCESS", payload: history });
      } catch {
        if (!cancelled) dispatch({ type: "FETCH_ERROR" });
      }
    }
    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedContact.id]);

  useEffect(() => {
    if (incomingMessages.length === 0) return;
    const latest = incomingMessages[incomingMessages.length - 1];
    dispatch({ type: "APPEND", payload: mapApiMessage(latest) });
  }, [incomingMessages]);

  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [messages, messagesEndRef]);

  if (isLoading) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${
          isDarkMode ? "bg-gray-900/30" : "bg-cyan-50/30"
        }`}
      >
        <Loader2
          className={`w-6 h-6 animate-spin ${
            isDarkMode ? "text-cyan-400" : "text-cyan-500"
          }`}
        />
      </div>
    );
  }

  return (
    <>
      {/* ✅ Scrollbar đổi màu theo dark mode */}
      <style>{`
        .msg-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .msg-scroll::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#1f2937" : "#f0f9ff"};
          border-radius: 4px;
        }
        .msg-scroll::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#4b5563" : "#a5f3fc"};
          border-radius: 4px;
        }
        .msg-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#6b7280" : "#22d3ee"};
        }
      `}</style>

      <div
        className={`msg-scroll flex-1 overflow-y-auto p-6 space-y-4 ${
          isDarkMode
            ? "bg-gradient-to-b from-gray-900/30 to-gray-800/30"
            : "bg-gradient-to-b from-cyan-50/30 to-blue-50/30"
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-cyan-500"
              }`}
            >
              Chưa có tin nhắn
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              normalizeId(msg.senderId) === normalizeId(currentUserId);
            const sender = memberMap.get(normalizeId(msg.senderId));
            const senderAvatar = sender?.avatarUrl ?? selectedContact.avatar;
            const senderDisplayName = sender?.fullName
              ? sender.fullName.split(" ").slice(-2).join(" ")
              : "";

            return (
              <div
                key={`${msg.id}-${index}`}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                style={{
                  animation: `messageSlide 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <div
                  className={`flex items-end gap-2 max-w-[65%] ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {!isMe && (
                    <img
                      src={senderAvatar}
                      alt={senderDisplayName || "avatar"}
                      className="w-9 h-9 rounded-full object-cover shadow-md flex-shrink-0 mb-5"
                    />
                  )}

                  <div className="flex flex-col gap-0.5">
                    {isGroup && !isMe && senderDisplayName && (
                      <span
                        className={`text-xs font-semibold px-1 ${
                          isDarkMode ? "text-cyan-400" : "text-cyan-600"
                        }`}
                      >
                        {senderDisplayName}
                      </span>
                    )}

                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-md ${
                        isMe
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700"
                          : "bg-white text-cyan-900 rounded-bl-sm border border-cyan-200/60"
                      }`}
                    >
                      {msg.attachment && (
                        <div className="mb-2">
                          {msg.attachment.type === "image" ? (
                            <img
                              src={msg.attachment.url}
                              alt="attachment"
                              className="max-w-full rounded-lg"
                            />
                          ) : (
                            <div
                              className={`flex items-center gap-2 p-2 rounded ${
                                isDarkMode ? "bg-gray-700" : "bg-cyan-50"
                              }`}
                            >
                              <File className="w-4 h-4" />
                              <span className="text-sm">
                                {msg.attachment.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <MessageContent
                        text={msg.text}
                        isDarkMode={isDarkMode}
                        isMe={isMe}
                      />
                      <span
                        className={`text-xs mt-1 block ${
                          isMe
                            ? "text-cyan-100"
                            : isDarkMode
                            ? "text-gray-400"
                            : "text-cyan-600"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
}
