"use client";
import React, { useEffect, useState } from "react";
import { Users, UserCheck, UserX, ArrowRight } from "lucide-react";
import { userService, UserStatsResponse } from "@/services/userService";
import Link from "next/link";

interface Props { isDark?: boolean; }

export default function UserManagementPreview({ isDark = false }: Props) {
    const [stats, setStats] = useState<UserStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        userService.getUserStatistics()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const card = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100";
    const title = isDark ? "text-gray-100" : "text-gray-800";
    const value = isDark ? "text-gray-100" : "text-gray-900";

    const rowBase = isDark
        ? "bg-gray-700/50 border-gray-600"
        : "";

    if (loading) return <div className={`animate-pulse ${isDark ? "bg-gray-800" : "bg-white"} p-6 rounded-2xl border h-64`} />;

    return (
        <div className={`${card} p-6 rounded-2xl shadow-sm border h-full`}>
            <div className="flex items-center justify-between mb-8">
                <h3 className={`text-lg font-bold ${title}`}>Tóm tắt người dùng</h3>
                <Link href="/admin/users" className="text-sm font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
                    Xem tất cả <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-6">
                {/* Total */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-gray-700/40 border-gray-600" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Users className="w-5 h-5" /></div>
                        <div>
                            <p className={`text-xs font-semibold uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}>Tổng số học viên</p>
                            <h4 className={`text-xl font-bold ${value}`}>{stats?.total.toLocaleString()}</h4>
                        </div>
                    </div>
                </div>

                {/* Active */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-green-900/20 border-green-800/40" : "bg-green-50 border-green-100"}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><UserCheck className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-semibold text-green-500 uppercase">Đang hoạt động</p>
                            <h4 className={`text-xl font-bold ${value}`}>{stats?.active.toLocaleString()}</h4>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-green-500">
                        {(((stats?.active || 0) / (stats?.total || 1)) * 100).toFixed(1)}%
                    </span>
                </div>

                {/* Banned */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-red-900/20 border-red-800/40" : "bg-red-50 border-red-100"}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><UserX className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-semibold text-red-500 uppercase">Tài khoản bị chặn</p>
                            <h4 className={`text-xl font-bold ${value}`}>{stats?.banned.toLocaleString()}</h4>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-red-500">{stats?.banned} users</span>
                </div>
            </div>
        </div>
    );
}
