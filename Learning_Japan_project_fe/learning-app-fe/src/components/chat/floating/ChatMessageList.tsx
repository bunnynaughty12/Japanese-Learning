"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import SenderAvatar from "./SenderAvatar";
import MessageContent from "./MessageContent";
import UserProfileCard from "./UserProfileCard";

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName?: string;
    timestamp: Date;
}

interface Contact {
    id: string;
    name: string;
    avatar: string;
    isGroup?: boolean;
}

interface ChatMessageListProps {
    isDarkMode: boolean;
    messages: Message[];
    currentUserId: string | number | null;
    selectedContact: Contact | null;
    isLoadingContacts: boolean;
    isLoadingMessages: boolean;
    senderNameMap: Record<string, string>;
    senderAvatarMap: Record<string, string>;
    onNavigate: (path: string) => void;
}

interface ActiveProfile {
    userId: string;
    x: number;
    y: number;
}

export default function ChatMessageList({
    isDarkMode: dark,
    messages,
    currentUserId,
    selectedContact,
    isLoadingContacts,
    isLoadingMessages,
    senderNameMap,
    senderAvatarMap,
    onNavigate,
}: ChatMessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageCount = messages.length;
    const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);

    // Scroll to bottom whenever new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageCount]);

    const handleAvatarClick = useCallback(
        (senderId: string, e: React.MouseEvent) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setActiveProfile({ userId: senderId, x: rect.right, y: rect.top });
        },
        []
    );

    return (
        <>
            <div
                className={`flex-1 overflow-y-auto p-3 space-y-3 ${dark ? "bg-[#0f172a] scrollbar-dark" : "bg-gray-50 scrollbar-light"
                    }`}
            >
                {isLoadingContacts || isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    </div>
                ) : !selectedContact ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                        <div className={`p-4 rounded-full ${dark ? "bg-gray-800" : "bg-cyan-50"}`}>
                            <MessageCircle
                                className={`w-8 h-8 ${dark ? "text-cyan-400" : "text-cyan-500"}`}
                            />
                        </div>
                        <p className={`text-xs font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>
                            Chọn cuộc trò chuyện để bắt đầu
                        </p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-10">
                        <div className="relative">
                            <img
                                src={selectedContact.avatar}
                                alt={selectedContact.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                                }}
                                className={`w-16 h-16 rounded-full object-cover ring-4 ${dark ? "ring-cyan-500/20 shadow-xl shadow-cyan-500/10" : "ring-white shadow-lg"
                                    }`}
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-[#0f172a] rounded-full" />
                        </div>
                        <div className="text-center">
                            <p
                                className={`text-sm font-bold mb-1 ${dark ? "text-gray-100" : "text-gray-800"
                                    }`}
                            >
                                {selectedContact.name}
                            </p>
                            <p className="text-[11px] text-gray-500 font-medium">Sẵn sàng để trò chuyện</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = String(msg.senderId) === String(currentUserId);
                        const displayName =
                            senderNameMap[msg.senderId] ?? msg.senderName ?? "";
                        const showName = selectedContact.isGroup && !isMe && displayName;

                        const memberAvatar = selectedContact.isGroup
                            ? senderAvatarMap[msg.senderId] ?? ""
                            : selectedContact.avatar;

                        return (
                            <div
                                key={`${msg.id}-${i}`}
                                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                                {!isMe && (
                                    <div className="shrink-0 mb-1">
                                        <SenderAvatar
                                            avatar={memberAvatar}
                                            name={displayName || selectedContact.name}
                                            isDarkMode={dark}
                                            size="sm"
                                            onClick={
                                                selectedContact.isGroup
                                                    ? (e) => handleAvatarClick(msg.senderId, e)
                                                    : undefined
                                            }
                                        />
                                    </div>
                                )}

                                <div
                                    className={`flex flex-col gap-1 max-w-[75%] ${isMe ? "items-end" : "items-start"
                                        }`}
                                >
                                    {showName && (
                                        <span className={`text-[10px] font-bold px-2 ${dark ? "text-cyan-400" : "text-cyan-600"
                                            }`}>
                                            {displayName}
                                        </span>
                                    )}
                                    <div
                                        className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all hover:shadow-md ${isMe
                                            ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-br-sm"
                                            : dark
                                                ? "bg-[#1e293b] text-gray-100 rounded-bl-sm border border-gray-700/50"
                                                : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm"
                                            }`}
                                    >
                                        <MessageContent
                                            text={msg.text}
                                            isMe={isMe}
                                            isDarkMode={dark}
                                            onNavigate={onNavigate}
                                        />
                                        <div
                                            className={`text-[9px] mt-1.5 font-medium flex items-center justify-end ${isMe ? "text-cyan-100/70" : "text-gray-500"
                                                }`}
                                        >
                                            {msg.timestamp.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── User Profile Card Popup ──────────────────────────────── */}
            {activeProfile && (
                <UserProfileCard
                    userId={activeProfile.userId}
                    anchorX={activeProfile.x}
                    anchorY={activeProfile.y}
                    isDarkMode={dark}
                    onClose={() => setActiveProfile(null)}
                />
            )}
        </>
    );
}
