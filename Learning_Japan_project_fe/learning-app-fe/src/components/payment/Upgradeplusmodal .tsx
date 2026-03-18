"use client";
import React from "react";
import {
  X,
  Check,
  Crown,
  Zap,
  Video,
  Clock,
  Shield,
  HeadphonesIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import VNPayCheckout from "./VNPayCheckout";
import {
  vipService,
  VipPackageResponse,
  PlanType,
} from "@/services/vipService";

interface UpgradePlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

/* ── helpers ── */

const PLAN_ORDER: PlanType[] = ["MONTHLY", "YEARLY", "LIFETIME"];

const PLAN_META: Record<
  PlanType,
  {
    label: string;
    period: string;
    badge: string | null;
    badgeColor?: string;
  }
> = {
  MONTHLY: { label: "Hàng tháng", period: "/ Tháng", badge: null },
  YEARLY: {
    label: "Hàng năm",
    period: "/ Năm",
    badge: "-45%",
    badgeColor: "from-orange-400 to-amber-500",
  },
  LIFETIME: {
    label: "Vĩnh viễn",
    period: "Một lần",
    badge: "🔥 Hot",
    badgeColor: "from-red-400 to-pink-500",
  },
};

function formatVND(price: number): string {
  return price.toLocaleString("vi-VN");
}

const FEATURES = [
  {
    icon: <Video className="w-5 h-5" />,
    text: "Không giới hạn số lượng thêm video",
  },
  {
    icon: <Video className="w-5 h-5" />,
    text: "Truy cập toàn bộ video trong kho",
  },
  { icon: <Clock className="w-5 h-5" />, text: "Hỗ trợ video dài đến 2 giờ" },
  {
    icon: <Zap className="w-5 h-5" />,
    text: "Luyện phát âm với AI thông minh",
  },
  {
    icon: <Crown className="w-5 h-5" />,
    text: "Mở khóa các tính năng kết hợp AI",
  },
  { icon: <Video className="w-5 h-5" />, text: "Tải video lên: 30 giờ/tháng" },
  { icon: <Shield className="w-5 h-5" />, text: "Không quảng cáo" },
  { icon: <HeadphonesIcon className="w-5 h-5" />, text: "Hỗ trợ 24/7" },
  { icon: <Check className="w-5 h-5" />, text: "Và nhiều hơn nữa..." },
];

/* ── component ── */

export default function UpgradePlusModal({
  isOpen,
  onClose,
  isDarkMode,
}: UpgradePlusModalProps) {
  const [selectedPlanType, setSelectedPlanType] =
    React.useState<PlanType>("MONTHLY");
  const [showPayment, setShowPayment] = React.useState(false);

  // data fetching state
  const [packages, setPackages] = React.useState<VipPackageResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // fetch packages when modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    vipService
      .getAll()
      .then((data) => {
        if (cancelled) return;
        // filter active & sort by plan order
        const active = data
          .filter((p) => p.active)
          .sort(
            (a, b) =>
              PLAN_ORDER.indexOf(a.planType) - PLAN_ORDER.indexOf(b.planType)
          );
        setPackages(active);
        // default select first available plan
        if (active.length > 0) setSelectedPlanType(active[0].planType);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? "Không thể tải gói VIP. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPackage = packages.find((p) => p.planType === selectedPlanType);

  const handleUpgradeClick = () => setShowPayment(true);
  const handleBackToPlans = () => setShowPayment(false);
  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onClose();
    alert(
      "Nâng cấp thành công! Tài khoản của bạn đã được nâng cấp lên NIBO Plus."
    );
  };

  /* ── render helpers ── */

  const renderPlanTabs = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={`flex items-center gap-2 justify-center py-3 px-4 rounded-xl text-sm ${
            isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => {
              // re-trigger by toggling a dummy state — easier: just close+reopen
              // Instead, expose a retry by re-running the effect via a key
              setError(null);
              setLoading(true);
              vipService
                .getAll()
                .then((data) => {
                  const active = data
                    .filter((p) => p.active)
                    .sort(
                      (a, b) =>
                        PLAN_ORDER.indexOf(a.planType) -
                        PLAN_ORDER.indexOf(b.planType)
                    );
                  setPackages(active);
                  if (active.length > 0)
                    setSelectedPlanType(active[0].planType);
                })
                .catch((e) => setError(e?.message ?? "Lỗi không xác định"))
                .finally(() => setLoading(false));
            }}
            className="underline ml-1 font-medium"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return (
      <div className="flex justify-center gap-3 flex-wrap">
        {packages.map((pkg) => {
          const meta = PLAN_META[pkg.planType] ?? {
            label: pkg.name,
            period: "",
            badge: null,
          };
          const isSelected = selectedPlanType === pkg.planType;
          return (
            <button
              key={pkg.id}
              onClick={() => setSelectedPlanType(pkg.planType)}
              className={`relative px-6 py-3 rounded-full font-semibold transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {meta.label}
              {meta.badge && (
                <span
                  className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold text-white rounded-full bg-gradient-to-r ${meta.badgeColor}`}
                >
                  {meta.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderPriceBlock = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3 mb-6 animate-pulse">
          <div
            className={`h-10 w-36 rounded-lg ${
              isDarkMode ? "bg-gray-600" : "bg-gray-200"
            }`}
          />
          <div
            className={`h-6 w-16 rounded-lg ${
              isDarkMode ? "bg-gray-600" : "bg-gray-200"
            }`}
          />
        </div>
      );
    }

    if (!selectedPackage) return null;

    const meta = PLAN_META[selectedPackage.planType];

    return (
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold">
            {formatVND(selectedPackage.price)}
          </span>
          <span
            className={`text-xl ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            VND
          </span>
          <span
            className={`text-lg ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            {meta?.period}
          </span>
        </div>

        {/* Duration info for non-lifetime */}
        {selectedPackage.durationDays !== null && (
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Thời hạn: {selectedPackage.durationDays} ngày
          </p>
        )}

        <p
          className={`text-sm mt-2 ${
            isDarkMode ? "text-gray-500" : "text-gray-500"
          }`}
        >
          Khuyến mãi chỉ áp dụng cho lần đầu tiên
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`modal-scroll relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-slide-up ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full transition-all hover:rotate-90 z-10 ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            {showPayment
              ? "Thanh toán"
              : "Mở khoá gói Plus với nhiều tính năng hữu ích"}
          </h2>
          {!showPayment && (
            <>
              <p
                className={`text-lg ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Nhiều gói phù hợp cho mọi học viên
              </p>
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Đầu tư vào bản thân là khoản đầu tư giá trị nhất dành cho bạn
              </p>
            </>
          )}
        </div>

        {showPayment ? (
          /* ── Payment View ── */
          <div className="px-8 pb-8">
            <div className="max-w-2xl mx-auto">
              <VNPayCheckout
                isDarkMode={isDarkMode}
                selectedPlan={
                  selectedPlanType.toLowerCase() as
                    | "monthly"
                    | "yearly"
                    | "lifetime"
                }
                amount={selectedPackage?.price ?? 0}
                packageId={selectedPackage?.id ?? ""}
                onBack={handleBackToPlans}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </div>
        ) : (
          /* ── Plan Selection View ── */
          <>
            {/* Plan Tabs */}
            <div className="px-8 mb-6">{renderPlanTabs()}</div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-8 px-8 pb-8">
              {/* Left: Plan Details */}
              <div>
                <div
                  className={`rounded-2xl p-6 ${
                    isDarkMode
                      ? "bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600"
                      : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-100"
                  }`}
                >
                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {loading
                          ? "NIBO Plus"
                          : selectedPackage?.name ?? "NIBO Plus"}
                      </h3>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Gói không giới hạn, thoải mái thêm video yêu thích
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  {renderPriceBlock()}

                  {/* CTA Button */}
                  <button
                    onClick={handleUpgradeClick}
                    disabled={loading || !!error || !selectedPackage}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải...
                      </span>
                    ) : (
                      "Nâng cấp Plus"
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Features List */}
              <div>
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Toàn bộ tính năng trong Free và thêm:
                </h3>
                <div className="space-y-3">
                  {FEATURES.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-cyan-50"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 ${
                          isDarkMode ? "text-cyan-400" : "text-cyan-600"
                        }`}
                      >
                        {feature.icon}
                      </div>
                      <span
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        /* Scrollbar dark mode */
        .modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#1f2937" : "#f1f5f9"};
          border-radius: 999px;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#4b5563" : "#cbd5e1"};
          border-radius: 999px;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#06b6d4" : "#94a3b8"};
        }
        /* Firefox */
        .modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode
            ? "#4b5563 #1f2937"
            : "#cbd5e1 #f1f5f9"};
        }
      `}</style>
    </div>
  );
}
