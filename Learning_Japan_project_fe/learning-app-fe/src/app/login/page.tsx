"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { login } from "@/services/authService";
import { useRouter } from "next/navigation";
import { getRolesFromToken } from "@/utils/jwt";
import ForgotPasswordModal from "../../components/profile/ForgotPasswordModal"; // Đảm bảo đường dẫn đúng

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Xoá mọi phiên token cũ khi truy cập vào trang Đăng nhập
  useEffect(() => {
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login({ email: username, password });
      console.log("Login result:", result);

      const roles = getRolesFromToken(result.accessToken);
      console.log("Decoded roles:", roles);

      if (roles.includes("ADMIN")) {
        console.log("Redirecting to /adminDashboard");
        router.push("/dasboardAdmin");
      } else {
        console.log("Redirecting to /video");
        router.push("/video");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 px-4">
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6 border border-cyan-100">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40"></div>
              <img
                src="/logo-cat.png"
                alt="NIBO Academy Logo"
                className="w-14 h-14 object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent text-center">
          Chào mừng đến với NIBO Academy
        </h2>




        {/* Error message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Tài khoản
            </label>
            <input
              type="text"
              placeholder="Tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-cyan-400
              focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl
                text-gray-900 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-cyan-400
                focus:border-transparent transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-cyan-500 hover:text-cyan-600 font-medium hover:underline"
            >
              Quên mật khẩu?
            </button>
            <Link
              href="/register"
              className="text-cyan-500 hover:text-cyan-600 font-medium"
            >
              Đăng ký
            </Link>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white py-3 rounded-xl transition disabled:opacity-50 font-medium shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  );
}
