"use client";
import React, { useEffect } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
    onCancel: () => void;
    isDark?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    title = "Xác nhận",
    message,
    confirmText = "Xóa",
    cancelText = "Hủy",
    variant = "danger",
    onConfirm,
    onCancel,
    isDark = false,
}: ConfirmDialogProps) {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onCancel();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const variantConfig = {
        danger: {
            iconBg: isDark ? "bg-red-500/15" : "bg-red-50",
            iconColor: "text-red-500",
            btnBg: "bg-red-500 hover:bg-red-600 active:bg-red-700",
            icon: <Trash2 className="w-6 h-6" />,
            ring: isDark ? "ring-red-500/20" : "ring-red-200",
        },
        warning: {
            iconBg: isDark ? "bg-amber-500/15" : "bg-amber-50",
            iconColor: "text-amber-500",
            btnBg: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700",
            icon: <AlertTriangle className="w-6 h-6" />,
            ring: isDark ? "ring-amber-500/20" : "ring-amber-200",
        },
        info: {
            iconBg: isDark ? "bg-blue-500/15" : "bg-blue-50",
            iconColor: "text-blue-500",
            btnBg: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700",
            icon: <AlertTriangle className="w-6 h-6" />,
            ring: isDark ? "ring-blue-500/20" : "ring-blue-200",
        },
    };

    const cfg = variantConfig[variant];

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onCancel}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

            {/* Modal */}
            <div
                className={`relative z-10 w-full max-w-md rounded-3xl shadow-2xl ring-1 ${cfg.ring} overflow-hidden
          ${isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"}
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className={`absolute top-4 right-4 p-1.5 rounded-xl transition-all duration-200
            ${isDark
                            ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-8">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${cfg.iconBg} ${cfg.iconColor}`}>
                        {cfg.icon}
                    </div>

                    {/* Content */}
                    <h2 className={`text-xl font-black mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {title}
                    </h2>
                    <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={onCancel}
                            className={`flex-1 py-3 px-5 rounded-2xl text-sm font-bold transition-all duration-200 border
                ${isDark
                                    ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-5 rounded-2xl text-sm font-black text-white shadow-lg transition-all duration-200 ${cfg.btnBg}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
