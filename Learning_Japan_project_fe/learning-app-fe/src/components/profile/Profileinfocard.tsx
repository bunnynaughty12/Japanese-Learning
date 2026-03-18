"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  Eye,
  EyeOff,
  User,
  Mail,
  Shield,
  Edit3,
  Save,
  ChevronRight,
  Crown,
  BookOpen,
} from "lucide-react";
import { UserProfileResponse } from "@/services/userService";
import { getAccessTokenFromStorage, getRolesFromToken } from "@/utils/jwt";
import { JLPTLevel } from "@/enums/JLPTLevel";

// ─── Password Modal ──────────────────────────────────────────────────────────

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function PasswordModal({
  isOpen,
  isDark,
  passwordForm,
  onClose,
  onPasswordChange,
  onSubmit,
}: {
  isOpen: boolean;
  isDark: boolean;
  passwordForm: PasswordForm;
  onClose: () => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}) {
  const [show, setShow] = useState({
    current: false,
    newPwd: false,
    confirm: false,
  });
  if (!isOpen) return null;

  const baseInput = `w-full pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium transition outline-none ${isDark
    ? "bg-gray-700 border border-gray-600 text-gray-100 focus:border-cyan-400 placeholder-gray-500"
    : "bg-gray-50 border border-gray-200 text-gray-800 focus:border-cyan-400 placeholder-gray-300"
    }`;

  const fields = [
    {
      name: "currentPassword" as keyof PasswordForm,
      label: "Mật khẩu hiện tại",
      value: passwordForm.currentPassword,
      shown: show.current,
      toggle: () => setShow((s) => ({ ...s, current: !s.current })),
    },
    {
      name: "newPassword" as keyof PasswordForm,
      label: "Mật khẩu mới",
      value: passwordForm.newPassword,
      shown: show.newPwd,
      toggle: () => setShow((s) => ({ ...s, newPwd: !s.newPwd })),
    },
    {
      name: "confirmPassword" as keyof PasswordForm,
      label: "Nhập lại mật khẩu mới",
      value: passwordForm.confirmPassword,
      shown: show.confirm,
      toggle: () => setShow((s) => ({ ...s, confirm: !s.confirm })),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-100"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-sm">
              <Key className="w-4 h-4 text-white" />
            </div>
            <h2
              className={`text-base font-bold ${isDark ? "text-gray-100" : "text-gray-800"
                }`}
            >
              Đổi mật khẩu
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${isDark
              ? "hover:bg-gray-700 text-gray-400"
              : "hover:bg-gray-100 text-gray-500"
              }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={field.shown ? "text" : "password"}
                  name={field.name}
                  value={field.value}
                  onChange={onPasswordChange}
                  className={baseInput}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={field.toggle}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {field.shown ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 flex justify-end gap-3 border-t ${isDark
            ? "border-gray-700 bg-gray-800/60"
            : "border-gray-100 bg-gray-50"
            }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${isDark
              ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500 hover:opacity-90 shadow-sm transition-all hover:shadow-md"
          >
            Xác nhận đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ProfileInfoCard ─────────────────────────────────────────────────────────

export interface ProfileInfoCardProps {
  user: UserProfileResponse;
  isDark: boolean;
  formData: { fullName: string; email: string; level: JLPTLevel };
  isEditing: boolean;
  passwordForm: PasswordForm;
  showPasswordModal: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onOpenPasswordModal: () => void;
  onClosePasswordModal: () => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitPassword: () => void;
}

export default function ProfileInfoCard({
  user,
  isDark,
  formData,
  isEditing,
  passwordForm,
  showPasswordModal,
  onInputChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onOpenPasswordModal,
  onClosePasswordModal,
  onPasswordChange,
  onSubmitPassword,
}: ProfileInfoCardProps) {
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
  const inputBase = `w-full px-4 py-2.5 rounded-xl text-sm font-medium transition outline-none ${isDark
    ? "bg-gray-700 border border-cyan-500/50 text-gray-100 focus:border-cyan-400 placeholder-gray-500"
    : "bg-white border border-cyan-400 text-gray-800 focus:border-cyan-500 placeholder-gray-300"
    }`;
  const disabledInput = `w-full px-4 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed ${isDark
    ? "bg-gray-700/40 border border-gray-700 text-gray-500"
    : "bg-gray-100 border border-gray-200 text-gray-400"
    }`;
  const iconBox = `w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700 text-cyan-400" : "bg-cyan-50 text-cyan-500"
    }`;
  const rowBorder = `border-b ${isDark ? "border-gray-700" : "border-gray-100"
    }`;
  const labelSm = `text-xs font-semibold uppercase tracking-wide mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"
    }`;
  const valText = `text-sm font-medium truncate ${isDark ? "text-gray-200" : "text-gray-700"
    }`;
  const chevronCls = `w-4 h-4 flex-shrink-0 ${isDark ? "text-gray-600" : "text-gray-300"
    }`;

  return (
    <>
      <div
        className={`rounded-3xl border shadow-2xl overflow-hidden transition-all duration-500 ${isDark
          ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-xl"
          : "bg-white/80 border-white/20 backdrop-blur-xl shadow-gray-200/50"
          }`}
      >
        {/* Card Header */}
        <div
          className={`px-8 py-6 border-b flex items-center justify-between ${isDark ? "border-white/5" : "border-gray-100"
            }`}
        >
          <div>
            <h3
              className={`font-extrabold text-xl tracking-tight ${isDark ? "text-white" : "text-gray-900"
                }`}
            >
              Thông tin cá nhân
            </h3>
            <p
              className={`text-sm mt-1 font-medium ${isDark ? "text-gray-500" : "text-gray-400"
                }`}
            >
              Quản lý danh tính và bảo mật tài khoản của bạn
            </p>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenPasswordModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-br from-rose-400 to-pink-600 hover:shadow-lg hover:shadow-rose-500/20 transition-all active:scale-95"
              >
                <Key className="w-3.5 h-3.5" /> Đổi mật khẩu
              </button>
              <button
                onClick={onStartEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-br from-indigo-500 to-cyan-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="px-8 py-2">
          {!isEditing ? (
            // ── VIEW MODE ──
            <div className="divide-y divide-gray-100/5">
              <div className={`group flex items-center gap-5 py-5 transition-all hover:translate-x-1`}>
                <div className={`${iconBox} group-hover:scale-110 transition-transform`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={labelSm}>Họ và tên</p>
                  <p className={`${valText} text-base`}>
                    {user.fullName || "Chưa cập nhật tên"}
                  </p>
                </div>
                <div className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-500/10">
                  <ChevronRight className={chevronCls} />
                </div>
              </div>

              <div className={`group flex items-center gap-5 py-5 transition-all hover:translate-x-1`}>
                <div className={`${iconBox} group-hover:scale-110 transition-transform`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={labelSm}>Địa chỉ Email</p>
                  <p className={`${valText} text-base`}>{user.email}</p>
                </div>
                <div className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-500/10">
                  <ChevronRight className={chevronCls} />
                </div>
              </div>

              <div className={`group flex items-center gap-5 py-5 transition-all hover:translate-x-1`}>
                <div className={`${iconBox} group-hover:scale-110 transition-transform`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={labelSm}>Trạng thái tài khoản</p>
                  {isVip ? (
                    <div className="mt-1">
                      <style>{`
                        @keyframes vipInfoShimmer {
                          0%   { background-position: 0% 50%; }
                          50%  { background-position: 100% 50%; }
                          100% { background-position: 0% 50%; }
                        }
                      `}</style>
                      <span
                        className="inline-flex items-center gap-1.5 px-4 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg relative overflow-hidden group/vip"
                        style={{
                          background: "linear-gradient(135deg, #f59e0b, #d97706, #fbbf24)",
                          backgroundSize: "200% 200%",
                          animation: "vipInfoShimmer 3s ease infinite",
                        }}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        PREMIUM VIP
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      STANDARD MEMBER
                    </span>
                  )}
                </div>
                <div className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-500/10">
                  <ChevronRight className={chevronCls} />
                </div>
              </div>
            </div>
          ) : (
            // ── EDIT MODE ──
            <div className="py-8 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                  >
                    <User className="w-3.5 h-3.5" /> Họ và tên của bạn
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={onInputChange}
                    className={`${inputBase} bg-white/5 border-white/10`}
                    placeholder="Nhập họ và tên đầy đủ"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Địa chỉ Email
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      value={formData.email}
                      className={`${disabledInput} border-transparent`}
                      disabled
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Shield className="w-4 h-4 text-gray-500/50" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Trình độ JLPT
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={onInputChange}
                    className={`${inputBase} bg-white/5 border-white/10 cursor-pointer`}
                  >
                    {Object.values(JLPTLevel).map((lvl) => (
                      <option key={lvl} value={lvl} className={isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={onCancelEdit}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${isDark
                    ? "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                  <X className="w-4 h-4" /> Hủy bỏ
                </button>
                <button
                  onClick={onSave}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-br from-indigo-500 to-cyan-500 hover:shadow-lg transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" /> Lưu thông tin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal — gắn ở đây để thuộc về component này */}
      <PasswordModal
        isOpen={showPasswordModal}
        isDark={isDark}
        passwordForm={passwordForm}
        onClose={onClosePasswordModal}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmitPassword}
      />
    </>
  );
}
