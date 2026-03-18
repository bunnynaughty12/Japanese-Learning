"use client";
import FloatingChatButton from "@/components/Floatingchatbutton ";
import MaziAIChat from "@/components/NiboChatAI";
import { useDarkMode } from "@/hooks/useDarkMode";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState } from "react";

/**
 * Standalone page nhúng 2 floating buttons:
 *  - FloatingChatButton  (Chat Room / nhóm / inbox)
 *  - MaziAIChat          (NIBO AI chatbot)
 *
 * Route: /chat/floating
 */
export default function FloatingChatPage() {
    const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentStreak, setCurrentStreak] = useState(0);

    if (!mounted) return null;

    return (
        <div
            className={`flex h-screen ${isDarkMode
                    ? "bg-gray-900"
                    : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
                }`}
        >
            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
                currentStreak={currentStreak}
                onStreakUpdate={setCurrentStreak}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

                <main className="flex-1 flex items-center justify-center">
                    <p
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                    >
                        Chat nổi – thử các nút ở góc phải phía dưới ↘
                    </p>
                </main>
            </div>

            {/* Floating components */}
            <MaziAIChat isDarkMode={isDarkMode} />
            <FloatingChatButton isDarkMode={isDarkMode} />
        </div>
    );
}
