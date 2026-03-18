"use client";

import Notification from "@/components/notification";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X, Shield } from "lucide-react";
import { register, RegisterRequest } from "@/services/userService";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning";
    message: string;
    id: number;
  } | null>(null);

  // Password strength check
  useEffect(() => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
    setPasswordCriteria(criteria);

    let strength = 0;
    if (criteria.length) strength += 25;
    if (criteria.uppercase) strength += 25;
    if (criteria.number) strength += 25;
    if (criteria.special) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  // Show notification
  const showNotification = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    setNotification({ type, message, id: Date.now() });
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return { text: "", color: "" };
    if (passwordStrength < 50) return { text: "Yếu", color: "text-red-500" };
    if (passwordStrength < 75)
      return { text: "Trung bình", color: "text-yellow-500" };
    if (passwordStrength < 100) return { text: "Mạnh", color: "text-cyan-500" };
    return { text: "Rất mạnh", color: "text-green-500" };
  };

  const getStrengthColor = () => {
    if (passwordStrength < 50) return "bg-red-500";
    if (passwordStrength < 75) return "bg-yellow-500";
    if (passwordStrength < 100) return "bg-cyan-500";
    return "bg-green-500";
  };

  const validateFields = () => {
    const newErrors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!fullName.trim()) {
      newErrors.fullName = "Họ và tên không được để trống";
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email không được để trống";
      isValid = false;
    } else if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Mật khẩu không được để trống";
      isValid = false;
    } else if (passwordStrength < 100) {
      newErrors.password = "Vui lòng đáp ứng đầy đủ các yêu cầu về mật khẩu";
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu không được để trống";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    setLoading(true);

    try {
      const data: RegisterRequest = { fullName, email, password };
      await register(data);

      showNotification(
        "success",
        "🎉 Đăng ký thành công! Chào mừng bạn đến với NIBO Academy!"
      );

      router.push("/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showNotification("error", err.message);
      } else {
        showNotification("error", "Có lỗi xảy ra khi đăng ký");
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthLabel = getStrengthLabel();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 px-4 py-8">
      {/* Notification */}
      {notification && (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-cyan-100 p-8 space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40"></div>
              <img
                src="/logo-cat.png"
                alt="NIBO Academy Logo"
                className="w-12 h-12 object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent text-center">
          Đăng ký tài khoản
        </h2>
        <p className="text-gray-500 text-center text-sm -mt-2">
          Tạo tài khoản mới để bắt đầu học tập
        </p>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              placeholder="Nhập họ và tên của bạn"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((prev) => ({ ...prev, fullName: "" }));
              }}
              className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition text-black"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <X className="w-4 h-4" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition text-black"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <X className="w-4 h-4" /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition pr-12 text-black"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-500 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password strength */}
            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${strengthLabel.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      Độ mạnh mật khẩu:
                    </span>
                    <span
                      className={`text-sm font-bold ${strengthLabel.color}`}
                    >
                      {strengthLabel.text}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {passwordStrength}%
                  </span>
                </div>

                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                  {[
                    { label: "Ít nhất 8 ký tự", met: passwordCriteria.length },
                    {
                      label: "1 chữ hoa (A-Z)",
                      met: passwordCriteria.uppercase,
                    },
                    { label: "1 số (0-9)", met: passwordCriteria.number },
                    {
                      label: "1 ký tự đặc biệt",
                      met: passwordCriteria.special,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs ${
                        item.met ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {item.met ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <X className="w-4 h-4" /> {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition pr-12 text-black"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-500 transition"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && password === confirmPassword && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <Check className="w-4 h-4" /> Mật khẩu khớp
              </p>
            )}
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <X className="w-4 h-4" /> {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Register button */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white py-3 rounded-xl transition font-medium shadow-lg mt-6 disabled:opacity-50 transform hover:scale-105"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký ngay"}
          </button>

          {/* Link login */}
          <div className="text-center mt-4">
            <span className="text-gray-600 text-sm">Đã có tài khoản? </span>
            <Link
              href="/login"
              className="text-cyan-500 hover:text-cyan-600 font-medium transition"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
