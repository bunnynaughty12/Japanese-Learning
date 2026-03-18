"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

interface NotificationProps {
  type: "success" | "error" | "warning";
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    // Đặt setState bất đồng bộ để tránh cảnh báo cascading renders
    const timerId = setTimeout(() => setIsVisible(true), 10);

    const autoCloseTimer = setTimeout(() => handleClose(), 5000);

    return () => {
      clearTimeout(timerId);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  const configs = {
    success: {
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      iconColor: "text-emerald-500",
      progress: "bg-emerald-500",
    },
    error: {
      icon: XCircle,
      gradient: "from-red-500 to-pink-500",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      iconColor: "text-red-500",
      progress: "bg-red-500",
    },
    warning: {
      icon: AlertCircle,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      iconColor: "text-amber-500",
      progress: "bg-amber-500",
    },
  };

  const config = configs[type] || configs.error;
  const Icon = config.icon;

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-300 ease-out ${isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
        }`}
    >
      <div
        className={`${config.bg} ${config.border} border-2 rounded-2xl shadow-2xl p-4 pr-12 min-w-[320px] max-w-md relative overflow-hidden backdrop-blur-sm`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-5`}
        />

        <div className="relative flex items-start gap-3">
          <div className={`${config.iconColor} mt-0.5 animate-bounce`}>
            <Icon className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p
              className={`${config.text} font-semibold text-sm leading-relaxed`}
            >
              {message}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 ${config.iconColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden">
          <div
            className={`h-full ${config.progress} animate-progress`}
            style={{ animation: "progress 5s linear forwards" }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;
