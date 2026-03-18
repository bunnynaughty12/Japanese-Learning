"use client";
import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { userService, UserProfileResponse } from "@/services/userService";
import { useDarkMode } from "@/hooks/useDarkMode";

interface AdminHeaderProps {
    onToggleDarkMode?: () => void;
    isDarkMode?: boolean;
}

export default function AdminHeader({ onToggleDarkMode, isDarkMode: propDark }: AdminHeaderProps) {
    const { isDarkMode: hookDark, toggleDarkMode } = useDarkMode();
    const isDark = propDark !== undefined ? propDark : hookDark;
    const [user, setUser] = useState<UserProfileResponse | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await userService.getProfile();
                setUser(res);
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        fetchUser();
    }, []);

    const handleToggle = () => {
        if (onToggleDarkMode) onToggleDarkMode();
        else toggleDarkMode();
    };

    return (
        <header className={`flex items-center justify-between px-8 py-4 border-b transition-colors duration-300 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-400 rounded-full blur-md opacity-20"></div>
                    <img
                        src="/logo-cat.png"
                        alt="NIBO Logo"
                        className="w-12 h-12 object-contain relative z-10"
                    />
                </div>
                <div>
                    <h1 className={`text-xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>NIBO Admin</h1>
                    <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Hệ thống quản trị học tập</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-700"}`}>Chào bạn, Quản trị viên</span>
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 font-bold">ONLINE</span>
                </div>

                <button
                    onClick={handleToggle}
                    className={`p-2 rounded-xl transition-all ${isDark ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shrink-0 shadow-sm transition hover:scale-105">
                    <img
                        src={user?.avatarUrl || "/logo-cat.png"}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </header>
    );
}
