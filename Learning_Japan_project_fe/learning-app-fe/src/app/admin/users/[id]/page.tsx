"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/dashboard/AdminHeader";
import { userService, UserProfileResponse } from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import { getRolesFromToken } from "@/utils/jwt";
import ProfileSideCard from "@/components/profile/Profilesidecard";
import { ChevronLeft, User, ShieldCheck, Mail, Calendar, Loader2 } from "lucide-react";

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);

    const id = params.id as string;

    // Route Protection
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

    useEffect(() => {
        if (!isReady || !id) return;

        const fetchUserDetail = async () => {
            setLoading(true);
            try {
                // Sử dụng getUserById hiện có (trả về UserChatResponse)
                // Tuy nhiên ta cần ép kiểu hoặc giả định backend trả về đủ field cho Admin
                const res = await userService.getUserById(id);
                setUser(res);
            } catch (error) {
                console.error("Lỗi lấy chi tiết user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetail();
    }, [id, isReady]);

    if (!isReady) return null;

    return (
        <div className="flex bg-[#F3F4F6] min-h-screen font-sans">
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col">
                <AdminHeader />

                <main className="p-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 mb-8 transition-colors group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Quay lại danh sách
                    </button>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Đang tải thông tin học viên...</p>
                        </div>
                    ) : user ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Side Card (Reused) */}
                            <div className="lg:col-span-1">
                                <ProfileSideCard
                                    user={{
                                        fullName: user.fullName,
                                        email: user.email,
                                        avatarUrl: user.avatarUrl || user.avatar,
                                        level: user.level || "N5",
                                        createdAt: user.createdAt || new Date().toISOString()
                                    } as any}
                                    isDark={false}
                                    onUploadAvatar={() => { }} // Admin không đổi được avatar ở đây
                                />
                            </div>

                            {/* Right: Detailed Info */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                        <h3 className="font-extrabold text-xl text-gray-900">Thông tin chi tiết</h3>
                                        <p className="text-sm text-gray-500 mt-1">Dữ liệu học tập và cá nhân của học viên</p>
                                    </div>

                                    <div className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Họ và tên</p>
                                                        <p className="text-base font-bold text-gray-900">{user.fullName}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                        <Mail className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email liên hệ</p>
                                                        <p className="text-base font-bold text-gray-900">{user.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày tham gia</p>
                                                        <p className="text-base font-bold text-gray-900">
                                                            {new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN', {
                                                                day: '2-digit', month: 'long', year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                                        <ShieldCheck className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại tài khoản</p>
                                                        <p className="text-base font-bold text-gray-900">
                                                            {user.isVip ? "PREMIUM VIP" : "FREE MEMBER"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-gray-500">Không tìm thấy thông tin người dùng.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
