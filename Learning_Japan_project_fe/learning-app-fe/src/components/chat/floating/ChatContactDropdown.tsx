"use client";
import { useRef, useEffect } from "react";
import { ChevronDown, Users, MessageCircle, Phone, X } from "lucide-react";

interface Contact {
    id: string;
    userId?: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    isGroup?: boolean;
}

type Tab = "GROUP" | "INBOX";

interface ChatContactDropdownProps {
    isDarkMode: boolean;
    selectedContact: Contact | null;
    showContactDropdown: boolean;
    setShowContactDropdown: (v: boolean | ((prev: boolean) => boolean)) => void;
    currentContacts: Contact[];
    activeTab: Tab;
    isLoadingContacts: boolean;
    onSelectContact: (c: Contact) => void;
    onTabChange: (tab: Tab) => void;
    onCall: () => void;
    onClose: () => void;
    showCallButton: boolean;
    unreadCounts?: Record<string, number>;
}

export default function ChatContactDropdown({
    isDarkMode: dark,
    selectedContact,
    showContactDropdown,
    setShowContactDropdown,
    currentContacts,
    activeTab,
    isLoadingContacts,
    onSelectContact,
    onTabChange,
    onCall,
    onClose,
    showCallButton,
    unreadCounts = {},
}: ChatContactDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowContactDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [setShowContactDropdown]);

    return (
        <div className={`shrink-0 bg-gradient-to-r ${dark ? "from-gray-800 to-gray-900 border-b border-gray-700/50" : "from-cyan-400 to-cyan-500"
            }`}>
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                {/* Contact selector */}
                <div className="flex-1 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowContactDropdown((v) => !v)}
                        className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition ${dark ? "bg-gray-700/50 hover:bg-gray-700 text-white" : "bg-white/20 hover:bg-white/30 text-white"}`}
                    >
                        {selectedContact ? (
                            <>
                                <img
                                    src={selectedContact.avatar}
                                    alt={selectedContact.name}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/default-avatar.png";
                                    }}
                                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                                />
                                <span className="text-white font-semibold text-sm truncate flex-1 text-left">
                                    {selectedContact.name}
                                </span>
                                {selectedContact.isGroup && (
                                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                                        Nhóm
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className={`${dark ? "text-gray-400" : "text-cyan-100"} text-sm flex-1 text-left`}>
                                {isLoadingContacts ? "Đang tải..." : "Chọn cuộc trò chuyện"}
                            </span>
                        )}
                        <ChevronDown
                            size={14}
                            className={`${dark ? "text-gray-400" : "text-white"} shrink-0 transition-transform ${showContactDropdown ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {/* Dropdown panel */}
                    {showContactDropdown && (
                        <div
                            className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-slide-up ${dark
                                ? "bg-gray-900 border-gray-700 shadow-cyan-500/5"
                                : "bg-white border-cyan-100"
                                }`}
                        >
                            {/* Tabs */}
                            <div
                                className={`flex border-b ${dark ? "border-gray-800" : "border-gray-100"
                                    }`}
                            >
                                {(["GROUP", "INBOX"] as Tab[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => onTabChange(tab)}
                                        className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${activeTab === tab
                                            ? "text-cyan-400 border-cyan-400"
                                            : `border-transparent ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`
                                            }`}
                                    >
                                        {tab === "GROUP" ? (
                                            <>
                                                <Users size={12} /> Nhóm
                                            </>
                                        ) : (
                                            <>
                                                <MessageCircle size={12} /> Bạn bè
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Contact list */}
                            <div
                                className={`max-h-52 overflow-y-auto ${dark ? "scrollbar-dark" : "scrollbar-light"
                                    }`}
                            >
                                {currentContacts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 px-4 opacity-50">
                                        <MessageCircle size={24} className={dark ? "text-gray-600" : "text-gray-300"} />
                                        <p className="text-[10px] mt-2 text-center text-gray-500">
                                            {isLoadingContacts ? "Đang tải..." : "Chưa có cuộc trò chuyện nào"}
                                        </p>
                                    </div>
                                ) : (
                                    currentContacts.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => onSelectContact(c)}
                                            className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-all ${selectedContact?.id === c.id
                                                ? dark
                                                    ? "bg-cyan-500/10 border-r-2 border-cyan-500"
                                                    : "bg-cyan-50 border-r-2 border-cyan-500"
                                                : dark
                                                    ? "hover:bg-gray-800"
                                                    : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="relative shrink-0">
                                                <img
                                                    src={c.avatar}
                                                    alt={c.name}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = c.isGroup
                                                            ? "/group-avatar.png"
                                                            : "/default-avatar.png";
                                                    }}
                                                    className={`w-9 h-9 rounded-full object-cover ring-2 ${selectedContact?.id === c.id ? "ring-cyan-500" : "ring-transparent"}`}
                                                />
                                                {c.isGroup && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
                                                        <Users size={8} className="text-white" />
                                                    </div>
                                                )}
                                                {/* Unread badge */}
                                                {(unreadCounts[c.id] ?? 0) > 0 && (
                                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-white dark:ring-gray-900 animate-pulse">
                                                        {(unreadCounts[c.id] ?? 0) > 99 ? "99+" : unreadCounts[c.id]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p
                                                        className={`text-xs font-bold truncate ${dark ? "text-gray-100" : "text-gray-800"
                                                            }`}
                                                    >
                                                        {c.name}
                                                    </p>
                                                    <span className="text-[9px] text-gray-500 shrink-0">
                                                        {c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <p className={`text-[10px] truncate ${dark ? "text-gray-500" : "text-gray-400"}`}>
                                                    {c.lastMessage || "Nói điều gì đó..."}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Call button */}
                {showCallButton && (
                    <button
                        onClick={onCall}
                        title="Gọi thoại"
                        className="hover:bg-white/20 rounded-full p-1.5 transition-colors shrink-0"
                    >
                        <Phone size={15} className="text-white" />
                    </button>
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="hover:bg-white/20 rounded-full p-1 transition-colors shrink-0"
                >
                    <X size={16} className="text-white" />
                </button>
            </div>
            <div className="px-3 pb-2 flex items-center gap-1.5" />
        </div>
    );
}
