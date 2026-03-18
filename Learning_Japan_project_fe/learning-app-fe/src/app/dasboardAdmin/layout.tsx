"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/dashboard/AdminHeader";
import FloatingChatButton from "@/components/Floatingchatbutton ";
import { useAuthStore } from "@/stores/authStore";
import { getRolesFromToken } from "@/utils/jwt";
import { useDarkMode } from "@/hooks/useDarkMode";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
                {children}
            </div>

            {/* Floating chat button – admin dark mode aware */}
            <FloatingChatButton isDarkMode={isDark} />
        </div>
    );
}
