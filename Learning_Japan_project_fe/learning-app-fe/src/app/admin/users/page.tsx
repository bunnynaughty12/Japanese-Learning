"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/dashboard/AdminHeader";
import UserManager from "@/components/admin/UserManager";
import { useAuthStore } from "@/stores/authStore";
import { getRolesFromToken } from "@/utils/jwt";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Users, ShieldCheck } from "lucide-react";

export default function AdminUsersPage() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const { isDarkMode: isDark } = useDarkMode();

    // Bảo vệ route ADMIN
    useEffect(() => {
        const { accessToken } = useAuthStore.getState();
        if (!accessToken) {
            router.push("/login");
            return;
        }
        const roles = getRolesFromToken(accessToken);
        if (!roles.includes("ADMIN")) {
            router.push("/login");
            return;
        }
        setIsReady(true);
    }, [router]);

    if (!isReady) return null;

    return (
        <div className={`flex min-h-screen font-sans transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-[#F3F4F6]"}`}>
            <Sidebar isDark={isDark} />

            <div className={`flex-1 ml-64 flex flex-col transition-colors duration-300 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                <AdminHeader isDarkMode={isDark} />

                <main className="p-8 space-y-6">
                    {/* Breadcrumbs / Page Title */}
                    <div className={`flex items-center gap-2 text-sm mb-2 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        <span className="hover:text-indigo-500 cursor-pointer transition-colors" onClick={() => router.push('/dasboardAdmin')}>Dashboard</span>
                        <span>/</span>
                        <span className={`font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Quản lý người dùng</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className={`text-2xl font-extrabold tracking-tight flex items-center gap-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                                <Users className={`w-7 h-7 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                                Hệ thống Quản lý Học viên
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                Xem chi tiết, tìm kiếm và kiểm soát trạng thái hoạt động của toàn bộ người dùng trên hệ thống.
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${isDark ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-50 text-green-600 border-green-100"}`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Secure Admin Access
                        </div>
                    </div>

                    {/* Main Content Component */}
                    <UserManager isDark={isDark} />
                </main>
            </div>
        </div>
    );
}
