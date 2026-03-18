"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    LogOut,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Crown,
    MessageSquare,
    Video,
    Languages,
    FileEdit,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface SidebarProps {
    isDark?: boolean;
}

export default function AdminSidebar({ isDark = false }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const menuItems = [
        {
            path: "/dasboardAdmin",
            icon: <LayoutDashboard className="w-5 h-5" />,
            label: "Dashboard",
        },
        {
            path: "/dasboardAdmin/users",
            icon: <Users className="w-5 h-5" />,
            label: "Quản lý Học viên",
        },
        {
            path: "/dasboardAdmin/courses",
            icon: <BookOpen className="w-5 h-5" />,
            label: "Quản lý Khóa học",
        },
        {
            path: "/dasboardAdmin/videos",
            icon: <Video className="w-5 h-5" />,
            label: "Quản lý Video",
        },
        {
            path: "/dasboardAdmin/kanji",
            icon: <Languages className="w-5 h-5" />,
            label: "Quản lý Kanji",
        },
        {
            path: "/dasboardAdmin/vip",
            icon: <Crown className="w-5 h-5" />,
            label: "Quản lý VIP",
        },
        {
            path: "/dasboardAdmin/feedback",
            icon: <MessageSquare className="w-5 h-5" />,
            label: "Quản lý Phản hồi",
        },
        {
            path: "/dasboardAdmin/exams",
            icon: <FileEdit className="w-5 h-5" />,
            label: "Quản lý Đề thi",
        },
    ];

    const isActive = (path: string) => pathname === path;

    /* ── colour tokens ─────────────────────────────── */
    const bg = isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
    const headerBorder = isDark ? "border-gray-700" : "border-gray-100";
    const logoText = isDark ? "text-gray-100" : "text-gray-900";
    const navBg = (active: boolean) =>
        active
            ? isDark
                ? "bg-indigo-600/30 text-indigo-300 font-bold shadow-sm"
                : "bg-indigo-50 text-indigo-600 font-bold shadow-sm"
            : isDark
                ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900";
    const iconColor = (active: boolean) =>
        active
            ? isDark ? "text-indigo-300" : "text-indigo-600"
            : isDark ? "text-gray-400 group-hover:text-gray-200" : "text-gray-400 group-hover:text-gray-600";
    const toggleBtn = isDark ? "hover:bg-gray-800 text-gray-500" : "hover:bg-gray-100 text-gray-400";
    const footerBorder = isDark ? "border-gray-700" : "border-gray-100";

    return (
        <aside
            className={`${isOpen ? "w-64" : "w-20"} ${bg} border-r transition-all duration-300 flex flex-col fixed left-0 top-0 h-screen z-50 shadow-sm`}
        >
            {/* Header Sidebar */}
            <div className={`p-4 border-b ${headerBorder} flex items-center justify-between`}>
                {isOpen ? (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="cursor-pointer group">
                            <img
                                src="/logo-cat.png"
                                alt="NIBO Admin"
                                className="w-10 h-10 object-contain transform group-hover:scale-110 transition-transform"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className={`font-extrabold leading-tight ${logoText}`}>NIBO</span>
                            <span className="text-[10px] font-bold text-indigo-500 tracking-tighter uppercase">ADMIN PANEL</span>
                        </div>
                    </div>
                ) : (
                    <img
                        src="/logo-cat.png"
                        alt="NIBO"
                        className="w-8 h-8 object-contain mx-auto"
                    />
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-1.5 rounded-lg transition-colors ${toggleBtn}`}
                >
                    {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${navBg(isActive(item.path))}`}
                    >
                        <div className={iconColor(isActive(item.path))}>
                            {item.icon}
                        </div>
                        {isOpen && <span className="text-sm">{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className={`p-3 border-t ${footerBorder} italic font-medium`}>
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isDark ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-red-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                >
                    <LogOut className={`w-5 h-5 ${isDark ? "text-red-500 group-hover:text-red-400" : "text-red-400 group-hover:text-red-500"}`} />
                    {isOpen && <span className="text-sm">Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
}
