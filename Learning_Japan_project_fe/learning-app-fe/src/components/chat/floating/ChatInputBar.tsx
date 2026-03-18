"use client";
import { Send } from "lucide-react";

interface ChatInputBarProps {
    isDarkMode: boolean;
    inputMessage: string;
    isConnected: boolean;
    selectedContactId: string | null;
    onChange: (val: string) => void;
    onSend: () => void;
}

export default function ChatInputBar({
    isDarkMode: dark,
    inputMessage,
    isConnected,
    selectedContactId,
    onChange,
    onSend,
}: ChatInputBarProps) {
    const canSend = !!inputMessage.trim() && isConnected && !!selectedContactId;

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div
            className={`px-3 py-3 border-t shrink-0 transition-colors ${dark ? "bg-[#1e293b] border-gray-800" : "bg-white border-gray-100"
                }`}
        >
            <div className="flex flex-row items-center gap-2.5">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                        selectedContactId ? "Nhập tin nhắn..." : "Chọn cuộc trò chuyện..."
                    }
                    disabled={!isConnected || !selectedContactId}
                    className={`flex-1 min-w-0 text-xs px-4 py-2.5 rounded-2xl border transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${dark
                        ? "bg-[#0f172a] border-gray-700 text-gray-100 placeholder-gray-500"
                        : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
                        }`}
                />
                <button
                    onClick={onSend}
                    disabled={!canSend}
                    className={`flex-none w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center disabled:opacity-40 transition-all ${canSend ? "animate-bounce-send hover:brightness-110" : ""
                        }`}
                >
                    <Send size={13} className="text-white" />
                </button>
            </div>
        </div>
    );
}
