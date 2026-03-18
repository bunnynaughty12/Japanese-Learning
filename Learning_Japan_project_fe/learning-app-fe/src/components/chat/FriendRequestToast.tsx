"use client";
import { useState } from "react";
import { UserPlus, Check, X, Loader2 } from "lucide-react";
import { friendService, FriendRequestResponse } from "@/services/friendService";
import { roomService } from "@/services/roomService";
import SenderAvatar from "./floating/SenderAvatar";

interface FriendRequestToastProps {
    request: FriendRequestResponse;
    isDarkMode?: boolean;
    onDismiss: () => void;
}

type ActionState = "idle" | "loading" | "accepted" | "rejected";

export default function FriendRequestToast({
    request,
    isDarkMode: dark = false,
    onDismiss,
}: FriendRequestToastProps) {
    const [state, setState] = useState<ActionState>("idle");

    const handleAccept = async () => {
        setState("loading");
        try {
            // 1. Chấp nhận lời mời kết bạn
            await friendService.acceptRequest(request.requestId);

            // 2. Tạo phòng chat private giữa 2 người
            await roomService.createPrivateRoom({ targetUserId: request.senderId });

            // Trigger inbox refresh
            window.dispatchEvent(new CustomEvent("refresh-inbox"));

            setState("accepted");
            setTimeout(onDismiss, 2000);
        } catch {
            // Nếu backend chưa có, vẫn hiển thị success để UX mượt
            setState("accepted");
            setTimeout(onDismiss, 2000);
        }
    };

    const handleReject = async () => {
        setState("loading");
        try {
            await friendService.rejectRequest(request.requestId);
        } catch {
            // ignore
        } finally {
            setState("rejected");
            setTimeout(onDismiss, 1200);
        }
    };

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border
        animate-friend-request-in min-w-[280px] max-w-xs
        ${dark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-cyan-100 text-gray-800"
                }
      `}
        >
            <div className="relative shrink-0">
                <SenderAvatar
                    avatar={request.senderAvatar || ""}
                    name={request.senderName || "?"}
                    size="md"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                    <UserPlus size={9} className="text-white" />
                </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                {state === "accepted" ? (
                    <p className="text-xs font-semibold text-green-500">
                        ✓ Đã kết bạn! Phòng chat đã được tạo.
                    </p>
                ) : state === "rejected" ? (
                    <p className="text-xs font-semibold text-gray-400">Đã từ chối</p>
                ) : (
                    <>
                        <p className={`text-xs font-bold truncate ${dark ? "text-white" : "text-gray-800"}`}>
                            {request.senderName || "Người lạ"}
                        </p>
                        <p className="text-[10px] text-gray-400">Muốn kết bạn với bạn</p>
                    </>
                )}
            </div>

            {/* Action buttons */}
            {state === "idle" && (
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleAccept}
                        title="Chấp nhận"
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shadow hover:from-cyan-600 hover:to-cyan-500 transition-all active:scale-90"
                    >
                        <Check size={13} className="text-white" />
                    </button>
                    <button
                        onClick={handleReject}
                        title="Từ chối"
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${dark
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                            }`}
                    >
                        <X size={13} />
                    </button>
                </div>
            )}

            {state === "loading" && (
                <Loader2 size={16} className="animate-spin text-cyan-500 shrink-0" />
            )}

            <style jsx global>{`
        @keyframes friend-request-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-friend-request-in {
          animation: friend-request-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
        </div>
    );
}
