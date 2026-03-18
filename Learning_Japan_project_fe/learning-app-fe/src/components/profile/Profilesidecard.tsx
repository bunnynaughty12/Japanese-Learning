"use client";
import React, { useRef, useState, useEffect } from "react";
import { Camera, Calendar, Target, Star, Crown } from "lucide-react";
import { UserProfileResponse } from "@/services/userService";
import { getAccessTokenFromStorage, getRolesFromToken } from "@/utils/jwt";

interface ProfileSideCardProps {
  user: UserProfileResponse;
  isDark: boolean;
  onUploadAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileSideCard({
  user,
  isDark,
  onUploadAvatar,
}: ProfileSideCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.isPremium || user.roles?.includes("USER_VIP")) {
        setIsVip(true);
      } else {
        const token = getAccessTokenFromStorage();
        if (token) {
          const roles = getRolesFromToken(token);
          setIsVip(roles.includes("USER_VIP"));
        }
      }
    }
  }, [user]);

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.fullName || "U"
  )}&background=06b6d4&color=fff&size=128`;

  const stats = [
    {
      icon: <Calendar className="w-3.5 h-3.5" />,
      label: "Tham gia",
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "short", year: "numeric" })
        : "Jan 2024",
    },
  ];

  return (
    <div
      className={`rounded-3xl border shadow-2xl overflow-hidden w-full transition-all duration-500 hover:shadow-cyan-500/10 ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-xl" : "bg-white/80 border-white/20 backdrop-blur-xl shadow-gray-200/50"
        }`}
    >
      {/* VIP shimmer keyframes */}
      {isVip && (
        <style>{`
          @keyframes vipBannerShimmer {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes vipCrownBob {
            0%, 100% { transform: translateY(0) scale(1.1); }
            50% { transform: translateY(-5px) scale(1.2); }
          }
          @keyframes vipStarTwinkle {
            0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
            50% { opacity: 0.4; transform: scale(1.4) rotate(45deg); }
          }
          @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 15px rgba(251,191,36,0.3); }
            50% { box-shadow: 0 0 30px rgba(251,191,36,0.6); }
          }
        `}</style>
      )}

      {/* Banner */}
      <div
        className="h-28 relative overflow-hidden"
        style={isVip ? {
          background: "linear-gradient(135deg, #f59e0b, #d97706, #fbbf24, #b45309)",
          backgroundSize: "200% 200%",
          animation: "vipBannerShimmer 4s ease infinite",
        } : {
          background: "linear-gradient(135deg, #22d3ee, #06b6d4, #0891b2)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {isVip && (
          <div className="absolute top-3 right-4 flex items-center gap-1.5">
            {[0, 0.3, 0.6].map((d, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5"
                style={{
                  fill: "rgba(255,255,255,0.9)",
                  color: "rgba(255,255,255,0.9)",
                  animation: `vipStarTwinkle 2s ease-in-out ${d}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        {/* Avatar Section */}
        <div className="relative -mt-14 mb-6 inline-block">
          {/* VIP glow ring */}
          {isVip && (
            <div
              className="absolute -inset-1.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #d97706, #fbbf24)",
                backgroundSize: "200% 200%",
                animation: "vipBannerShimmer 3s ease infinite, glowPulse 3s ease-in-out infinite",
                zIndex: 0,
              }}
            />
          )}
          <div
            className={`w-28 h-28 rounded-full border-4 shadow-xl overflow-hidden bg-gray-200 relative z-[1] transition-transform duration-500 hover:scale-105 ${isDark ? "border-gray-800" : "border-white"
              }`}
          >
            <img
              src={user.avatarUrl || avatarFallback}
              alt="avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = avatarFallback;
              }}
            />
          </div>

          {/* VIP crown icon */}
          {isVip && (
            <div
              className="absolute -top-5 left-1/2 -translate-x-1/2 z-[2]"
              style={{ animation: "vipCrownBob 2s ease-in-out infinite" }}
            >
              <Crown className="w-7 h-7" style={{ color: "#d97706", filter: "drop-shadow(0 2px 4px rgba(217,119,6,0.6))" }} />
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all z-[2] border-2 border-white/20"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUploadAvatar}
          />
        </div>

        {/* User Info */}
        <div className="space-y-1 mb-6">
          <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
            {user.fullName || "Học viên Nibo"}
          </h2>
          <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {user.email}
          </p>
        </div>

        {/* Level & VIP Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            {user.level || "N5"} LEVEL
          </div>
          {isVip && (
            <div
              className="flex items-center gap-1.5 px-4 py-1.5 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg overflow-hidden relative group"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
              }}
            >
              <Crown className="w-3 h-3" />
              VIP MEMBER
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>
          )}
        </div>

        <div className={`h-px w-full mb-8 ${isDark ? "bg-white/5" : "bg-gray-100"}`} />

        {/* Stats List */}
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex items-center p-3 rounded-2xl border transition-all hover:translate-x-1 ${isDark
                ? "bg-white/5 border-white/5 hover:bg-white/10"
                : "bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-md"
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                }`}>
                {stat.icon}
              </div>
              <div className="ml-3">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {stat.label}
                </p>
                <p className={`text-sm font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}

          {/* Account Type Row */}
          <div
            className={`flex items-center p-3 rounded-2xl border transition-all hover:translate-x-1 ${isVip && !isDark ? "bg-amber-50/50 border-amber-100 shadow-amber-100/20" :
              isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50/50 border-gray-100 hover:bg-white"
              }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isVip ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 text-white" :
              isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"
              }`}>
              {isVip ? <Crown className="w-5 h-5" /> : <Star className="w-5 h-5" />}
            </div>
            <div className="ml-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Tài khoản
              </p>
              <p className={`text-sm font-black ${isVip ? "bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent" :
                isDark ? "text-gray-200" : "text-gray-800"
                }`}>
                {isVip ? "PREMIUM VIP" : "FREE MEMBER"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
