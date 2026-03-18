"use client";
import React, { useEffect, useState } from "react";
import { Receipt, Calendar, CreditCard, ChevronRight, Loader2, ExternalLink, Package, ShieldCheck } from "lucide-react";
import { orderService, OrderResponse } from "@/services/orderService";

interface BillingHistoryCardProps {
    isDark: boolean;
}

export default function BillingHistoryCard({ isDark: dark }: BillingHistoryCardProps) {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await orderService.getMyOrders();
                setOrders(data || []);
            } catch (error) {
                console.error("Lỗi lấy lịch sử hóa đơn:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUCCESS": return "text-green-500 bg-green-500/10";
            case "PENDING": return "text-amber-500 bg-amber-500/10";
            case "CANCELLED":
            case "FAILED": return "text-red-500 bg-red-500/10";
            default: return "text-gray-400 bg-gray-400/10";
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className={`rounded-3xl border transition-all duration-500 overflow-hidden ${dark
            ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-xl shadow-2xl"
            : "bg-white/70 border-white/40 backdrop-blur-xl shadow-xl shadow-indigo-100/20"
            }`}>
            {/* Header */}
            <div className={`px-6 py-5 border-b flex items-center justify-between ${dark ? "border-gray-700/50" : "border-gray-100"}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                        <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`font-bold text-base ${dark ? "text-white" : "text-gray-900"}`}>Lịch sử Giao dịch</h3>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${dark ? "text-gray-400" : "text-gray-500"}`}>Quản lý thanh toán & Gói dịch vụ</p>
                    </div>
                </div>
                {orders.length > 0 && !loading && (
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                        {orders.length} hóa đơn
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className={`w-8 h-8 animate-spin mb-3 ${dark ? "text-indigo-400" : "text-indigo-500"}`} />
                        <p className={`text-sm font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>Đang tải dữ liệu...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10">
                        <div className={`w-16 h-16 mx-auto rounded-3xl mb-4 flex items-center justify-center ${dark ? "bg-gray-700/50" : "bg-gray-50"}`}>
                            <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-800"}`}>Chưa có giao dịch nào</p>
                        <p className={`text-xs mt-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>Nâng cấp VIP để trải nghiệm các tính năng đặc biệt</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {orders.map((order, index) => {
                            const firstItem = order.items?.[0];
                            const itemName = firstItem?.courseName || firstItem?.vipPackageName || "Sản phẩm";
                            const itemType = firstItem?.productType || "N/A";

                            return (
                                <div
                                    key={order.orderId}
                                    className={`group p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${dark
                                        ? "bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 hover:border-indigo-500/30"
                                        : "bg-gray-50/50 border-gray-200 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
                                        }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${dark ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-600"}`}>
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold text-sm truncate ${dark ? "text-white" : "text-gray-900"}`}>{itemName}</h4>
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${itemType === 'VIP_PACKAGE' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                        {itemType === 'VIP_PACKAGE' ? 'VIP' : 'Khóa học'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`flex items-center gap-1 text-[10px] font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(order.createdAt)}
                                                    </span>
                                                    <span className={`flex items-center gap-1 text-[10px] font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>
                                                        <CreditCard className="w-3 h-3" />
                                                        {order.paymentMethod}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-sm ${dark ? "text-white" : "text-indigo-600"}`}>{formatCurrency(order.amount)}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusColor(order.status)}`}>
                                                    {order.status === "SUCCESS" ? "Thành công" : order.status === "PENDING" ? "Chờ duyệt" : "Thất bại"}
                                                </span>
                                                <button className={`p-1 rounded-lg transition-colors ${dark ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 bg-opacity-50 flex items-center justify-between ${dark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${dark ? "text-green-500" : "text-green-600"}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-500"}`}>Thanh toán bảo mật bởi VNPay</span>
                </div>
                <button className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group transition-colors ${dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}>
                    Yêu cầu hỗ trợ
                    <ExternalLink className="w-3 h-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${dark ? '#374151' : '#e5e7eb'};
                    border-radius: 999px;
                }
            `}</style>
        </div>
    );
}
