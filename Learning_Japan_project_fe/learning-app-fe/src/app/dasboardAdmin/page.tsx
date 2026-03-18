"use client";
import React from "react";
import { useRouter } from "next/navigation";
import RevenueExhibition from "@/components/admin/dashboard/RevenueExhibition";
import UserManagementPreview from "@/components/admin/dashboard/UserManagementPreview";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Activity, LayoutGrid, Clock, ChevronRight } from "lucide-react";

export default function DashboardAdmin() {
    const router = useRouter();
    const { isDarkMode: isDark } = useDarkMode();

    return (
        <main className="p-8 space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>Tổng Quan Hệ Thống</h2>
                    <div className={`flex items-center gap-2 mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        <Clock className="w-4 h-4" />
                        <span>Cập nhật mới nhất: {new Date().toLocaleTimeString('vi-VN')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                    <Activity className="w-3.5 h-3.5" />
                    LIVE MONITORING
                </div>
            </div>

            {/* Revenue Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                    <h3 className={`font-bold uppercase tracking-wider text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>Thống kê doanh thu</h3>
                </div>
                <RevenueExhibition isDark={isDark} />
            </section>

            {/* User & Activities Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <section className="space-y-4 h-full">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                            <h3 className={`font-bold uppercase tracking-wider text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>Quản lý người dùng</h3>
                        </div>
                        <UserManagementPreview isDark={isDark} />
                    </section>
                </div>

                <div className="lg:col-span-2">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                            <h3 className={`font-bold uppercase tracking-wider text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>Hành động nhanh</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => router.push('/dasboardAdmin/users')}
                                className={`p-6 rounded-2xl border shadow-sm transition-all text-left flex items-start gap-4 group ${isDark ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md"}`}
                            >
                                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                                    <LayoutGrid className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Quản lý Học viên</h4>
                                    <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Xem chi tiết, khóa/mở khóa tài khoản học viên.</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-3">
                                        Truy cập ngay <ChevronRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </button>

                            <button className={`p-6 rounded-2xl border shadow-sm transition-all text-left flex items-start gap-4 group cursor-not-allowed opacity-60 ${isDark ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:border-blue-300 hover:shadow-md"}`}>
                                <div className={`p-3 rounded-xl ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Báo cáo JLPT</h4>
                                    <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Phân tích kết quả thi thử của toàn hệ thống.</p>
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-3 ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                        Coming Soon
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => router.push('/dasboardAdmin/kanji')}
                                className={`p-6 rounded-2xl border shadow-sm transition-all text-left flex items-start gap-4 group ${isDark ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:border-purple-300 hover:shadow-md"}`}
                            >
                                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Quản lý Kanji</h4>
                                    <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Thêm mới và quản lý danh sách Hán tự.</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 mt-3">
                                        Truy cập ngay <ChevronRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Lời chào ngày mới, Admin!</h3>
                                <p className="text-white/80 text-sm max-w-md">
                                    Hệ thống đang hoạt động ổn định. Hôm nay có thể là một ngày tuyệt vời để cập nhật lộ trình học tập mới cho học viên.
                                </p>
                                <button
                                    onClick={() => router.push('/dasboardAdmin/users')}
                                    className="mt-6 px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all shadow-lg"
                                >
                                    Bắt đầu làm việc
                                </button>
                            </div>
                            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

