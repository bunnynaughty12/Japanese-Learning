"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-sm shadow-lg border-b border-cyan-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40"></div>
            <img
              src="/logo-cat.png"
              alt="NIBO Academy Logo"
              className="w-12 h-12 object-contain relative z-10 drop-shadow-lg"
            />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">
            NIBO ACADEMY
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-700 text-sm">
                Xin chào,{" "}
                <b className="text-cyan-600">{user?.fullName || user?.email}</b>
              </span>
              <button
                onClick={logout}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent mb-4">
            📚 Chào mừng đến với NIBO Academy
          </h1>

          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Nền tảng học tập thông minh giúp bạn luyện tập, kiểm tra và nâng cao
            kiến thức mỗi ngày 🚀
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            title="📝 Luyện tập"
            desc="Làm bài tập, câu hỏi trắc nghiệm theo từng cấp độ."
            gradient="from-cyan-400 to-cyan-500"
          />
          <FeatureCard
            title="📊 Thi thử"
            desc="Thi thử như thi thật, chấm điểm tự động."
            gradient="from-cyan-500 to-cyan-600"
          />
          <FeatureCard
            title="🤖 AI hỗ trợ"
            desc="AI giải thích đáp án, gợi ý cách học hiệu quả."
            gradient="from-cyan-400 to-blue-500"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  gradient,
}: {
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border border-cyan-100">
      <div
        className={`inline-block px-4 py-2 bg-gradient-to-r ${gradient} rounded-xl mb-4 shadow-md`}
      >
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}
