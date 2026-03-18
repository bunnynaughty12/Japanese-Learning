"use client";
import React, { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, default 3500
}

// ─── Toast Store (simple pub/sub) ──────────────────────────────────────────
type Listener = (toasts: ToastData[]) => void;

let toasts: ToastData[] = [];
const listeners = new Set<Listener>();

function notify() {
    listeners.forEach((l) => l([...toasts]));
}

export function showToast(
    type: ToastType,
    title: string,
    message?: string,
    duration = 3500
) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    toasts = [...toasts, { id, type, title, message, duration }];
    notify();

    // Auto-remove
    setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        notify();
    }, duration);
}

// ─── Convenience helpers ───────────────────────────────────────────────────
export const toast = {
    success: (title: string, message?: string) =>
        showToast("success", title, message),
    error: (title: string, message?: string) =>
        showToast("error", title, message),
    warning: (title: string, message?: string) =>
        showToast("warning", title, message),
    info: (title: string, message?: string) =>
        showToast("info", title, message),
};

// ─── Config per type ───────────────────────────────────────────────────────
const config: Record<
    ToastType,
    {
        icon: React.ReactNode;
        gradient: string;
        iconBg: string;
        border: string;
        progressColor: string;
    }
> = {
    success: {
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        gradient: "from-emerald-500/10 to-teal-500/5",
        iconBg: "bg-emerald-500/15",
        border: "border-emerald-500/20",
        progressColor: "bg-emerald-500",
    },
    error: {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        gradient: "from-red-500/10 to-rose-500/5",
        iconBg: "bg-red-500/15",
        border: "border-red-500/20",
        progressColor: "bg-red-500",
    },
    warning: {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        gradient: "from-amber-500/10 to-yellow-500/5",
        iconBg: "bg-amber-500/15",
        border: "border-amber-500/20",
        progressColor: "bg-amber-500",
    },
    info: {
        icon: <Info className="w-5 h-5 text-blue-500" />,
        gradient: "from-blue-500/10 to-cyan-500/5",
        iconBg: "bg-blue-500/15",
        border: "border-blue-500/20",
        progressColor: "bg-blue-500",
    },
};

// ─── Single Toast Item ─────────────────────────────────────────────────────
function ToastItem({
    data,
    onDismiss,
}: {
    data: ToastData;
    onDismiss: (id: string) => void;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const c = config[data.type];
    const duration = data.duration ?? 3500;

    useEffect(() => {
        // Enter animation
        requestAnimationFrame(() => setIsVisible(true));

        // Exit animation before removal
        const exitTimer = setTimeout(() => {
            setIsLeaving(true);
        }, duration - 400);

        return () => clearTimeout(exitTimer);
    }, [duration]);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(() => onDismiss(data.id), 300);
    };

    return (
        <div
            className={`
        relative w-[380px] max-w-[90vw] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl
        bg-gradient-to-r ${c.gradient} ${c.border}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving
                    ? "translate-x-0 opacity-100 scale-100"
                    : "translate-x-8 opacity-0 scale-95"
                }
      `}
            style={{
                background: "rgba(15, 23, 42, 0.92)",
                backdropFilter: "blur(20px)",
            }}
        >
            <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Icon */}
                <div
                    className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                    {c.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-bold text-gray-100 leading-tight">
                        {data.title}
                    </p>
                    {data.message && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            {data.message}
                        </p>
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
                <div
                    className={`h-full ${c.progressColor} rounded-full`}
                    style={{
                        animation: `toast-progress ${duration}ms linear forwards`,
                    }}
                />
            </div>
        </div>
    );
}

// ─── Toast Container ───────────────────────────────────────────────────────
export function ToastContainer() {
    const [items, setItems] = useState<ToastData[]>([]);

    useEffect(() => {
        const listener: Listener = (t) => setItems(t);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    const handleDismiss = useCallback((id: string) => {
        toasts = toasts.filter((t) => t.id !== id);
        notify();
    }, []);

    if (items.length === 0) return null;

    return (
        <>
            <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
            <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none">
                {items.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem data={t} onDismiss={handleDismiss} />
                    </div>
                ))}
            </div>
        </>
    );
}
