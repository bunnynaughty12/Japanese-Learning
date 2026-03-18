"use client";
import React from "react";
import { ShoppingCart, X, CreditCard, Lock } from "lucide-react";

interface CoursePurchaseModalProps {
    isDark: boolean;
    courseTitle: string;
    price: number;
    onConfirm: () => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

export default function CoursePurchaseModal({
    isDark,
    courseTitle,
    price,
    onConfirm,
    onCancel,
    isProcessing = false,
}: CoursePurchaseModalProps) {
    const formatVND = (amount: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden
          ${isDark
                        ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                        : "bg-white border border-gray-100"
                    }
        `}
            >
                {/* Header gradient strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />

                {/* Close button */}
                <button
                    onClick={onCancel}
                    className={`absolute top-4 right-4 p-1 rounded-full transition-colors
            ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}
          `}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Body */}
                <div className="p-6 pt-5">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <ShoppingCart className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                        Mua khóa học
                    </h2>
                    <p className={`text-sm text-center mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Bạn sắp mua khóa học sau đây
                    </p>

                    {/* Course info card */}
                    <div className={`rounded-xl p-4 mb-5 ${isDark ? "bg-gray-700/50 border border-gray-600" : "bg-cyan-50 border border-cyan-100"}`}>
                        <p className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Khóa học</p>
                        <p className={`font-semibold mb-3 ${isDark ? "text-gray-100" : "text-gray-800"}`}>{courseTitle}</p>
                        <div className={`border-t pt-3 flex justify-between items-center ${isDark ? "border-gray-600" : "border-cyan-200"}`}>
                            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Tổng thanh toán</span>
                            <span className="text-lg font-bold text-cyan-500">{formatVND(price)}</span>
                        </div>
                    </div>

                    {/* Security note */}
                    <div className={`flex items-center gap-2 text-xs mb-5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Thanh toán an toàn qua cổng VNPay được mã hóa SSL</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isProcessing}
                            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all
                ${isDark
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                } disabled:opacity-50`}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className="flex-2 flex-grow py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            ) : (
                                <CreditCard className="w-4 h-4" />
                            )}
                            {isProcessing ? "Đang xử lý..." : "Thanh toán VNPay"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
