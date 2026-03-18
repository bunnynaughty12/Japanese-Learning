"use client";
import React, { useState, useEffect } from "react";
import {
    Search,
    MoreVertical,
    ShieldCheck,
    ShieldAlert,
    UserX,
    UserCheck,
    Trash2,
    Filter,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import { userService, UserResponseManager } from "@/services/userService";

interface UserManagerProps {
    isDark?: boolean;
}

export default function UserManager({ isDark = false }: UserManagerProps) {
    const router = useRouter();
    const [users, setUsers] = useState<UserResponseManager[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const size = 10;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.getAllUsersManager(page, size, search);
            setUsers(response.data);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error("Lỗi lấy danh sách user:", error);
            alert("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const handleBan = async (email: string) => {
        try {
            await userService.banUser(email);
            alert(`Đã khóa tài khoản ${email}`);
            fetchUsers();
        } catch (error) {
            alert("Khóa tài khoản thất bại");
        }
    };

    const handleUnban = async (email: string) => {
        try {
            await userService.unbanUser(email);
            alert(`Đã mở khóa tài khoản ${email}`);
            fetchUsers();
        } catch (error) {
            alert("Mở khóa thất bại");
        }
    };

    const getRoleBadge = (role: string[]) => {
        if (role.includes("ADMIN")) {
            return (
                <span className="px-2 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Admin
                </span>
            );
        }
        return (
            <span className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                Student
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <div>
                    <h2 className={`text-xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Danh sách học viên</h2>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Quản lý và điều chỉnh quyền truy cập của người dùng ({totalElements})</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm email, tên..."
                            className={`pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-full md:w-64 transition-all ${isDark ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                        />
                    </div>
                    <button className={`p-2 border rounded-xl transition-colors ${isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"}`}>
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all font-bold text-sm shadow-md ${isDark ? "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"}`}>
                        <UserPlus className="w-4 h-4" />
                        Thêm mới
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className={`rounded-3xl shadow-sm border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={`border-b ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50/50 border-gray-100"}`}>
                                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Thông tin</th>
                                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Vai trò</th>
                                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Trạng thái</th>
                                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Nhật ký đăng ký</th>
                                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-right ${isDark ? "text-gray-400" : "text-gray-500"}`}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6"><div className={`h-10 rounded-xl w-full ${isDark ? "bg-gray-700" : "bg-gray-100"}`}></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                        Không tìm thấy người dùng nào
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className={`transition-colors group ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50/50"}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img
                                                        src={user.avatarUrl || "/logo-cat.png"}
                                                        alt={user.fullName}
                                                        className={`w-10 h-10 rounded-full object-cover border ${isDark ? "border-gray-600" : "border-gray-100"}`}
                                                    />
                                                    {user.isPremium && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                                            <Star className="w-2.5 h-2.5 text-white fill-current" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold transition-colors ${isDark ? "text-gray-100 group-hover:text-indigo-400" : "text-gray-900 group-hover:text-indigo-600"}`}>{user.fullName}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.enabled ? (
                                                <div className="flex items-center gap-1.5 text-green-500">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs font-bold">Hoạt động</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-red-500">
                                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                                                    <span className="text-xs font-bold">Bị khóa</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                                    className={`p-2 rounded-lg transition-all ${isDark ? "text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                                                    title="Xem chi tiết hồ sơ"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {user.enabled ? (
                                                    <button
                                                        onClick={() => handleBan(user.email)}
                                                        className={`p-2 rounded-lg transition-all ${isDark ? "text-gray-400 hover:text-red-400 hover:bg-red-500/20" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}
                                                        title="Khóa tài khoản"
                                                    >
                                                        <ShieldAlert className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUnban(user.email)}
                                                        className={`p-2 rounded-lg transition-all ${isDark ? "text-gray-400 hover:text-green-400 hover:bg-green-500/20" : "text-gray-400 hover:text-green-500 hover:bg-green-50"}`}
                                                        title="Mở khóa tài khoản"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className={`p-2 rounded-lg transition-all ${isDark ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}>
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className={`px-6 py-4 flex items-center justify-between border-t ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50/50 border-gray-100"}`}>
                    <p className={`text-xs font-medium font-sans ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Hiển thị {users.length} trên {totalElements} kết quả
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className={`p-2 rounded-xl border transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${page === i
                                        ? isDark ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 border-indigo-500" : "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                        : isDark ? "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            )).slice(Math.max(0, page - 1), Math.min(totalPages, page + 2))}
                        </div>
                        <button
                            disabled={page === totalPages - 1 || totalPages === 0}
                            onClick={() => setPage(p => p + 1)}
                            className={`p-2 rounded-xl border transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}

// Giả lập icon Star bị thiếu
function Star({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
        </svg>
    )
}
