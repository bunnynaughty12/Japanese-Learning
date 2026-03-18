"use client";
import React, { useState } from "react";
import { MoreVertical, Search, MessageCircle, Users } from "lucide-react";
import InboxList from "@/components/chat/roomtype/Inboxlist";
import GroupList from "@/components/chat/roomtype/Grouplist";

type ActiveTab = "INBOX" | "GROUP";

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

interface ContactsListProps {
  selectedContact: Contact | null;
  isConnected: boolean;
  searchQuery: string;
  isDarkMode: boolean;
  initialTab?: ActiveTab; // ← prop mới để auto-switch tab khi share
  onSearchChange: (query: string) => void;
  onSelectContact: (contact: Contact) => void;
}

export default function ContactsList({
  selectedContact,
  isConnected,
  searchQuery,
  isDarkMode,
  initialTab,
  onSearchChange,
  onSelectContact,
}: ContactsListProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab ?? "INBOX");

  return (
    <div
      className={`w-[380px] border-r flex flex-col shadow-xl transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white/90 border-cyan-200/60"
      }`}
    >
      {/* Header */}
      <div
        className={`p-6 border-b transition-colors duration-300 ${
          isDarkMode
            ? "border-gray-700 bg-gray-800/80"
            : "border-cyan-200/60 bg-gradient-to-r from-cyan-50/80 to-blue-50/80"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle
              className={`w-6 h-6 ${
                isDarkMode ? "text-cyan-400" : "text-cyan-600"
              }`}
            />
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? "text-gray-100" : "text-cyan-900"
              }`}
            >
              Tin nhắn
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-red-500"
              }`}
              title={isConnected ? "Đã kết nối" : "Mất kết nối"}
            />
            <button
              className={`p-2 rounded-full transition-colors ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-cyan-100"
              }`}
            >
              <MoreVertical
                className={`w-5 h-5 ${
                  isDarkMode ? "text-gray-300" : "text-cyan-600"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              isDarkMode
                ? "text-gray-400 group-focus-within:text-cyan-400"
                : "text-cyan-400 group-focus-within:text-cyan-600"
            }`}
          />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-cyan-500/40 focus:border-cyan-500/40"
                : "bg-cyan-50/50 border-cyan-200/60 text-gray-900 placeholder-cyan-400 focus:ring-cyan-500/40 focus:border-cyan-500/40"
            }`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex border-b ${
          isDarkMode
            ? "border-gray-700 bg-gray-800/40"
            : "border-cyan-200/60 bg-white/40"
        }`}
      >
        <button
          onClick={() => setActiveTab("INBOX")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "INBOX"
              ? isDarkMode
                ? "text-cyan-400 border-cyan-500"
                : "text-cyan-700 border-cyan-500"
              : isDarkMode
              ? "text-gray-400 border-transparent hover:text-gray-300"
              : "text-cyan-500 border-transparent hover:text-cyan-700"
          }`}
        >
          Bạn
        </button>
        <button
          onClick={() => setActiveTab("GROUP")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "GROUP"
              ? isDarkMode
                ? "text-cyan-400 border-cyan-500"
                : "text-cyan-700 border-cyan-500"
              : isDarkMode
              ? "text-gray-400 border-transparent hover:text-gray-300"
              : "text-cyan-500 border-transparent hover:text-cyan-700"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Cộng đồng
        </button>
      </div>

      {/* List */}
      <div
        className={`flex-1 overflow-y-auto ${
          isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar"
        }`}
      >
        {activeTab === "INBOX" ? (
          <InboxList
            selectedContact={selectedContact}
            isDarkMode={isDarkMode}
            onSelectContact={onSelectContact}
          />
        ) : (
          <GroupList
            selectedContact={selectedContact}
            isDarkMode={isDarkMode}
            onSelectContact={onSelectContact}
          />
        )}
      </div>
    </div>
  );
}
