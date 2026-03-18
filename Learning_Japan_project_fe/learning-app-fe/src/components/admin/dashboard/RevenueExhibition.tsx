"use client";
import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";
import { revenueService, RevenueSummaryResponse } from "@/services/revenueService";

interface Props { isDark?: boolean; }

export default function RevenueExhibition({ isDark = false }: Props) {
    const [revenue, setRevenue] = useState<RevenueSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        revenueService.getSummary()
            .then(r => { if (r) setRevenue(r); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const fmt = (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

    const card = isDark ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:shadow-md";
    const label = isDark ? "text-gray-400" : "text-gray-500";
    const value = isDark ? "text-gray-100" : "text-gray-900";

    if (loading) return <div className={`animate-pulse ${isDark ? "bg-gray-800" : "bg-white"} p-6 rounded-2xl border h-48`} />;

    const cards = [
        { icon: <DollarSign className="w-6 h-6" />, bg: "bg-blue-500/20", iconCls: "text-blue-400", badge: "+12.5%", badgeCls: "text-green-400 bg-green-500/10", label: "Tổng doanh thu", value: fmt(revenue?.totalRevenue || 0) },
        { icon: <Calendar className="w-6 h-6" />, bg: "bg-emerald-500/20", iconCls: "text-emerald-400", badge: "Today", badgeCls: "text-emerald-400 bg-emerald-500/10", label: "Doanh thu hôm nay", value: fmt(revenue?.todayRevenue || 0) },
        { icon: <TrendingUp className="w-6 h-6" />, bg: "bg-purple-500/20", iconCls: "text-purple-400", badge: "Month", badgeCls: "text-purple-400 bg-purple-500/10", label: "Doanh thu tháng này", value: fmt(revenue?.monthRevenue || 0) },
        { icon: <CreditCard className="w-6 h-6" />, bg: "bg-orange-500/20", iconCls: "text-orange-400", badge: "Orders", badgeCls: "text-orange-400 bg-orange-500/10", label: "Đơn hàng thành công", value: String(revenue?.totalSuccessOrders || 0) },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((c, i) => (
                <div key={i} className={`p-6 rounded-2xl shadow-sm border transition-all ${card}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 ${c.bg} rounded-xl ${c.iconCls}`}>{c.icon}</div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${c.badgeCls}`}>{c.badge}</span>
                    </div>
                    <p className={`text-sm font-medium ${label}`}>{c.label}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${value}`}>{c.value}</h3>
                </div>
            ))}
        </div>
    );
}
