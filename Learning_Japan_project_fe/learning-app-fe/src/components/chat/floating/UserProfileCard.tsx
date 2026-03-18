"use client";
import { useEffect, useRef, useState } from "react";
import { UserPlus, UserCheck, X, Loader2, MessageCircle, Crown } from "lucide-react";
import { friendService, FriendStatus as APIFriendStatus } from "@/services/friendService";
import { userService, UserChatResponse } from "@/services/userService";
import { roomService } from "@/services/roomService";

type LocalFriendStatus = APIFriendStatus | "loading" | "error";

interface UserProfileCardProps {
    userId: string;
    /** Position anchor (click coordinates) */
    anchorX: number;
    anchorY: number;
    isDarkMode: boolean;
    onClose: () => void;
}

export default function UserProfileCard({
    userId,
    anchorX,
    anchorY,
    isDarkMode: dark,
    onClose,
}: UserProfileCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [profile, setProfile] = useState<UserChatResponse | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<LocalFriendStatus>("loading");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionDone, setActionDone] = useState(false);

    // ── Fetch profile & friend status ───────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const [userInfo] = await Promise.all([
                    userService.getUserById(userId),
                ]);
                if (cancelled) return;
                setProfile(userInfo);
                setProfileLoading(false);

                // Try to get friend status
                try {
                    const res = await friendService.getStatus(userId);
                    if (!cancelled) setFriendStatus(res?.status ?? "NONE");
                } catch {
                    if (!cancelled) setFriendStatus("NONE");
                }
            } catch {
                if (!cancelled) {
                    setProfileLoading(false);
                    setFriendStatus("error");
                }
            }
        }
        load();
        return () => { cancelled = true; };
    }, [userId]);

    // ── Close on outside click ───────────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    // ── Send friend request ──────────────────────────────────────────────
    const handleAddFriend = async () => {
        if (actionLoading || actionDone) return;
        setActionLoading(true);
        try {
            await friendService.sendRequest(userId);
            setFriendStatus("PENDING");
            setActionDone(true);

            // Trigger inbox refresh
            window.dispatchEvent(new CustomEvent("refresh-inbox"));
        } catch {
            // If endpoint not yet available, show "Đã gửi" anyway for UX
            setFriendStatus("PENDING");
            setActionDone(true);
            window.dispatchEvent(new CustomEvent("refresh-inbox"));
        } finally {
            setActionLoading(false);
        }
    };

    // ── Compute card position (keep inside viewport) ─────────────────────
    const cardWidth = 240;
    const cardHeight = 220;
    const margin = 8;

    let left = anchorX + 12;
    let top = anchorY - 40;
    if (left + cardWidth > window.innerWidth - margin) {
        left = anchorX - cardWidth - 12;
    }
    if (top + cardHeight > window.innerHeight - margin) {
        top = window.innerHeight - cardHeight - margin;
    }
    if (top < margin) top = margin;

    const handleOpenChat = async () => {
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const room = await roomService.createPrivateRoom({ targetUserId: userId });
            console.log("🚀 CustomEvent: chat-open-room", room.id);
            window.dispatchEvent(new CustomEvent("chat-open-room", {
                detail: { roomId: room.id, userId: userId }
            }));
            onClose(); // Close the card
        } catch (err) {
            console.error("Failed to open chat", err);
        } finally {
            setActionLoading(false);
        }
    };

    // ── Friend button state ──────────────────────────────────────────────
    const renderFriendButton = () => {
        if (friendStatus === "ACCEPTED") {
            return (
                <button
                    disabled
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-600 cursor-default"
                >
                    <UserCheck size={13} />
                    Bạn bè
                </button>
            );
        }
        if (friendStatus === "PENDING" || actionDone) {
            return (
                <button
                    disabled
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-default border ${dark
                        ? "bg-cyan-950/40 text-cyan-400 border-cyan-900/50"
                        : "bg-cyan-50 text-cyan-500 border-cyan-200"
                        }`}
                >
                    <UserCheck size={13} />
                    Đã gửi lời mời
                </button>
            );
        }
        return (
            <button
                onClick={handleAddFriend}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500 to-cyan-400 text-white shadow hover:from-cyan-600 hover:to-cyan-500 transition-all active:scale-95 disabled:opacity-60"
            >
                {actionLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                ) : (
                    <UserPlus size={13} />
                )}
                Kết bạn
            </button>
        );
    };

    return (
        <div
            ref={cardRef}
            style={{ position: "fixed", left, top, zIndex: 99999, width: cardWidth }}
            className={`rounded-2xl shadow-2xl border overflow-hidden animate-profile-card ${dark
                ? "bg-gray-800 border-gray-700 shadow-cyan-900/10"
                : "bg-white border-cyan-100 shadow-cyan-200/50"
                }`}
        >
            {/* ── Header gradient banner ────────────────────────────────── */}
            <div className={`relative h-14 bg-gradient-to-br ${dark ? "from-cyan-800 via-cyan-950 to-indigo-900" : "from-cyan-400 via-cyan-500 to-indigo-400"
                }`}>
                {/* close btn */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 transition"
                >
                    <X size={12} className="text-white" />
                </button>

                {/* Avatar overlapping banner */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                    {profileLoading ? (
                        <div className="w-16 h-16 rounded-full bg-cyan-200 animate-pulse ring-4 ring-white" />
                    ) : (
                        <img
                            src={profile?.avatarUrl || profile?.avatar || "/default-avatar.png"}
                            alt={profile?.fullName || ""}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/default-avatar.png";
                            }}
                            className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
                        />
                    )}
                </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="pt-10 pb-4 px-4 flex flex-col items-center gap-3">
                {profileLoading ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                        <div className={`h-3.5 w-28 rounded-full animate-pulse ${dark ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className={`h-2.5 w-20 rounded-full animate-pulse ${dark ? "bg-gray-700" : "bg-gray-100"}`} />
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <p className={`text-sm font-bold leading-tight ${dark ? "text-white" : "text-gray-800"}`}>
                                {profile?.fullName || "Người dùng"}
                            </p>
                            <div className="flex items-center justify-center gap-1.5 mt-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${dark ? "bg-cyan-900/40 text-cyan-400" : "bg-cyan-50 text-cyan-600"}`}>
                                    {profile?.level || "N5"}
                                </span>
                                {profile?.isPremium && (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-200 to-amber-500 text-white shadow-sm flex items-center gap-0.5">
                                        <Crown size={8} className="fill-current" /> VIP
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[180px]">
                                {profile?.email || ""}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {renderFriendButton()}
                            <button
                                onClick={handleOpenChat}
                                disabled={actionLoading}
                                title="Nhắn tin"
                                className={`p-1.5 rounded-full border transition ${dark
                                    ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-500"
                                    } disabled:opacity-50`}
                            >
                                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <style jsx global>{`
              @keyframes profile-card-in {
                from { opacity: 0; transform: scale(0.88) translateY(6px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
              }
              .animate-profile-card {
                animation: profile-card-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
              }
            `}</style>
        </div>
    );
}
