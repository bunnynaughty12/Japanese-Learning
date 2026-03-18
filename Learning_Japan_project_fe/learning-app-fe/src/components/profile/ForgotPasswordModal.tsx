"use client";

import { useState } from "react";
import { X, Mail, KeyRound, Lock } from "lucide-react";
import { forgotPassword, confirmForgotPassword } from "@/services/authService";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Nhập Email, Step 2: Nhập Code & Pass mới
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Xử lý gửi mã xác nhận (Step 1)
  const handleSendCode = async () => {
    if (!email) {
      setMessage({ type: "error", text: "Vui lòng nhập email" });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await forgotPassword(email);
      setMessage({
        type: "success",
        text: "Mã xác nhận đã được gửi đến email của bạn.",
      });
      setStep(2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Đã xảy ra lỗi";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đổi mật khẩu (Step 2)
  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ thông tin" });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await confirmForgotPassword({ email, otp: code, newPassword });
      setMessage({
        type: "success",
        text: "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.",
      });
      setTimeout(() => {
        onClose();
        setStep(1); // Reset form
        setEmail("");
        setCode("");
        setNewPassword("");
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Đã xảy ra lỗi";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {step === 1 ? "Quên mật khẩu?" : "Đặt lại mật khẩu"}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          {step === 1
            ? "Nhập email của bạn để nhận mã xác nhận."
            : `Nhập mã xác nhận đã gửi tới ${email}`}
        </p>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* STEP 1: INPUT EMAIL */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition"
                  placeholder="name@gmail.com"
                />
              </div>
            </div>
          )}

          {/* STEP 2: INPUT CODE & NEW PASSWORD */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã xác nhận
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition"
                    placeholder="Nhập mã 6 số"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
              </div>
            </>
          )}

          <button
            onClick={step === 1 ? handleSendCode : handleResetPassword}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Đang xử lý..."
              : step === 1
              ? "Gửi mã xác nhận"
              : "Đổi mật khẩu"}
          </button>

          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-cyan-600 transition mt-2"
            >
              Quay lại nhập email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
