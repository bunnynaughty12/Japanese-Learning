"use client";
import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Mail, LogOut, Moon, Sun, Crown, Star } from "lucide-react";
import { userService, UserProfileResponse } from "@/services/userService";
import { logout } from "@/services/authService";
import { useRouter } from "next/navigation";
import { getAccessTokenFromStorage, getRolesFromToken } from "@/utils/jwt";

interface UserDropdownProps {
  isDark: boolean;
  onToggleDarkMode: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  isDark,
  onToggleDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userService.getProfile();
        // Lưu ý: Kiểm tra xem res trả về trực tiếp object user hay bọc trong 'result'
        // Nếu API trả về: { result: { ...user data... } } thì dùng dòng dưới:
        // setUser(res.result);
        // Nếu userService đã xử lý lấy data ra rồi thì giữ nguyên:
        setUser(res);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout API failed", error);
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } finally {
      setIsOpen(false);
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="relative" ref={dropdownRef}>
        {/* --- 1. SỬA PHẦN NÚT BẤM (TRIGGER) --- */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer group relative z-[9999] flex items-center justify-center"
        >
          <img
            src={user?.avatarUrl || "/logo-cat.png"}
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm transform group-hover:scale-105 transition-transform"
          />
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 top-full mt-2 w-64 ${isDark
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
              } border rounded-xl shadow-2xl overflow-hidden z-[9999]`}
          >
            {/* Header User Info */}
            <div
              className={`p-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <div className="flex items-center gap-2">
                {/* --- 2. SỬA PHẦN AVATAR BÊN TRONG DROPDOWN --- */}
                <div
                  className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 cursor-pointer shrink-0"
                  onClick={() => router.push("/profile")}
                >
                  {/* Kiểm tra: Có ảnh thì hiện ảnh, không thì hiện chữ cái đầu */}
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {user?.fullName
                        ? user.fullName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm truncate ${isDark ? "text-gray-100" : "text-gray-900"
                      }`}
                  >
                    {user?.fullName || "Người dùng"}
                  </div>
                  <div
                    className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {user?.email || "email@example.com"}
                  </div>
                </div>
              </div>
            </div>

            {/* ... (Các phần còn lại giữ nguyên) ... */}
            <div
              className={`p-2 border-b ${isDark ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <button
                onClick={onToggleDarkMode}
                className={`w-full flex items-center justify-between px-3 py-2 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } rounded-lg transition`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-white" />
                    ) : (
                      <Sun className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${isDark ? "text-gray-100" : "text-gray-900"
                      }`}
                  >
                    Chế độ hiển thị
                  </span>
                </div>
                <div
                  className={`relative w-10 h-5 ${isDark ? "bg-green-500" : "bg-gray-300"
                    } rounded-full transition-colors`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isDark ? "translate-x-5" : ""
                      }`}
                  ></div>
                </div>
              </button>
            </div>

            <div className="p-2">
              {isVip ? (
                /* ===== VIP BADGE ===== */
                <>
                  <style>{`
                    @keyframes vipShimmer {
                      0%   { background-position: 0% 50%; }
                      50%  { background-position: 100% 50%; }
                      100% { background-position: 0% 50%; }
                    }
                    @keyframes vipStarPulse {
                      0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
                      50% { transform: scale(1.35) rotate(18deg); opacity: 0.8; }
                    }
                  `}</style>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706, #fbbf24, #92400e)",
                      backgroundSize: "200% 200%",
                      animation: "vipShimmer 3s ease infinite",
                      borderRadius: "12px",
                      padding: "2px",
                    }}
                  >
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] ${isDark ? "bg-gray-800" : "bg-white"
                        }`}
                    >
                      {/* Crown icon */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #fbbf24, #d97706)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 12px rgba(251,191,36,0.75)",
                          flexShrink: 0,
                        }}
                      >
                        <Crown className="w-4 h-4 text-white" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-bold truncate"
                          style={{
                            background: "linear-gradient(90deg, #d97706, #fbbf24, #d97706)",
                            backgroundSize: "200%",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            animation: "vipShimmer 3s ease infinite",
                          }}
                        >
                          VIP Member
                        </div>
                        <div
                          className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          Gói cao cấp đang hoạt động
                        </div>
                      </div>

                      {/* Animated stars */}
                      <div className="flex gap-0.5">
                        {[0, 0.3, 0.6].map((delay, i) => (
                          <Star
                            key={i}
                            className="w-3 h-3"
                            style={{
                              fill: "#fbbf24",
                              color: "#fbbf24",
                              animation: `vipStarPulse 1.6s ease-in-out ${delay}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ===== NON-VIP: upgrade button ===== */
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    } rounded-lg transition`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      className={`text-sm font-medium ${isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                    >
                      NiBo Plus
                    </div>
                  </div>
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full font-medium">
                    Khuyến mãi
                  </span>
                </button>
              )}

              <button
                onClick={() => { setIsOpen(false); router.push("/feedback"); }}
                className={`w-full flex items-center gap-2 px-3 py-2 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } rounded-lg transition mt-1`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span
                  className={`text-sm font-medium ${isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                >
                  Hỗ trợ & Phản hồi
                </span>
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full flex items-center gap-2 px-3 py-2 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } rounded-lg transition mt-1 group/logout ${isLoggingOut ? "opacity-50 cursor-wait" : ""
                  }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg flex items-center justify-center group-hover/logout:from-red-500 group-hover/logout:to-red-600 transition-all">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
                <span
                  className={`text-sm font-medium ${isDark ? "text-gray-100" : "text-gray-900"
                    } group-hover/logout:text-red-500 transition-colors`}
                >
                  {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                </span>
              </button>
            </div>

            <div
              className={`p-2 border-t ${isDark
                ? "border-gray-700 bg-gray-900/50"
                : "border-gray-200 bg-gray-50"
                }`}
            >
              <div
                className={`text-xs text-center ${isDark ? "text-gray-500" : "text-gray-400"
                  }`}
              >
                Version 1.1.2
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserDropdown;
