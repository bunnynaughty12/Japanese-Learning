"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import LoadingCat from "@/components/LoadingCat";
import { useDarkMode } from "@/hooks/useDarkMode";
import FeedbackPage from "@/components/FeedbackPage";

export default function FeedbackRoute() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentStreak, setCurrentStreak] = useState(0);
    const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();

    if (!mounted)
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

    return (
        <div
            className={`flex h-screen ${isDarkMode
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

                <div
                    className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar"
                        }`}
                >
                    <FeedbackPage isDark={isDarkMode} />
                </div>
            </div>
        </div>
    );
}
