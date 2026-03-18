"use client";
import React from "react";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import {
  vnPayService,
  CreateVnPayResponse,
  OrderSuccessResponse,
} from "@/services/VnPayService";

interface VNPayCheckoutProps {
  isDarkMode: boolean;
  selectedPlan: "monthly" | "yearly" | "lifetime";
  amount: number; // chỉ dùng để hiển thị UI
  packageId: string; // truyền vào service để tạo payment
  onBack: () => void;
  onSuccess: () => void;
}

export default function VNPayCheckout({
  isDarkMode,
  selectedPlan,
  amount,
  packageId,
  onBack,
  onSuccess,
}: VNPayCheckoutProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<"confirm" | "processing" | "success">(
    "confirm"
  );
  const [orderData, setOrderData] = React.useState<OrderSuccessResponse | null>(
    null
  );

  const planNames: Record<string, string> = {
    monthly: "Hàng tháng",
    yearly: "Hàng năm",
    lifetime: "Vĩnh viễn",
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setStep("processing");

      // Tạo VNPay payment URL, truyền amount từ package đã chọn
      console.log("🔄 Creating VNPay payment for package:", packageId);
      const response = await vnPayService.create({
        productId: packageId,
        productType: "VIP_PACKAGE",
      });

      // Debug: xem http wrapper trả về cấu trúc gì
      console.log("📦 Raw response:", JSON.stringify(response));

      // Một số http wrapper lồng thêm { data: {...} } bên ngoài
      // nên check cả response.data.paymentUrl lẫn response.paymentUrl
      type WrappedResponse = CreateVnPayResponse & {
        data?: CreateVnPayResponse;
      };
      const wrapped = response as WrappedResponse;
      const paymentUrl: string | undefined =
        wrapped?.data?.paymentUrl ?? wrapped?.paymentUrl;

      console.log("🔗 Extracted paymentUrl:", paymentUrl);

      if (!paymentUrl) {
        throw new Error(
          `Không nhận được paymentUrl. Response: ${JSON.stringify(response)}`
        );
      }

      // Redirect đến VNPay
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("❌ Payment error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi xử lý thanh toán"
      );
      setIsProcessing(false);
      setStep("confirm");
    }
  };

  // Xử lý return từ VNPay
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const responseCode = params.get("vnp_ResponseCode");
    const txnRef = params.get("vnp_TxnRef");

    if (responseCode && txnRef) {
      handleReturn(responseCode, txnRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReturn = async (responseCode: string, _txnRef: string) => {
    try {
      setStep("processing");
      console.log("🔄 Processing VNPay return...", { responseCode });

      if (responseCode !== "00") {
        throw new Error("Thanh toán không thành công hoặc đã bị hủy");
      }

      const queryString = window.location.search.slice(1);
      const result = await vnPayService.handleReturn(queryString);
      console.log("✅ Payment processed:", result);

      setOrderData(result);
      setStep("success");
    } catch (err) {
      console.error("❌ Return processing error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể hoàn tất thanh toán. Vui lòng liên hệ hỗ trợ."
      );
      setStep("confirm");
    }
  };

  return (
    <div
      className={`rounded-2xl p-8 ${isDarkMode
          ? "bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600"
          : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-100"
        }`}
    >
      {/* Back Button */}
      {step === "confirm" && (
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-6 transition-colors ${isDarkMode
              ? "text-gray-400 hover:text-gray-300"
              : "text-gray-600 hover:text-gray-800"
            }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
      )}

      {/* ── Confirm Step ── */}
      {step === "confirm" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Xác nhận thanh toán</h3>
              <p
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Thanh toán an toàn với VNPay
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div
            className={`rounded-xl p-4 mb-6 ${isDarkMode ? "bg-gray-800/50" : "bg-white/80"
              }`}
          >
            <div className="flex justify-between mb-2">
              <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Gói:
              </span>
              <span className="font-semibold">
                NIBO Plus – {planNames[selectedPlan] ?? selectedPlan}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Số tiền:
              </span>
              <span className="font-semibold">
                {amount.toLocaleString("vi-VN")} VND
              </span>
            </div>
            <div
              className={`border-t mt-3 pt-3 flex justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <span
                className={`text-lg font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"
                  }`}
              >
                Tổng cộng:
              </span>
              <span className="text-lg font-bold text-cyan-500">
                {amount.toLocaleString("vi-VN")} VND
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* VNPay Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing || !packageId}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Thanh toán với VNPay
              </>
            )}
          </button>

          <p
            className={`text-xs text-center mt-4 ${isDarkMode ? "text-gray-500" : "text-gray-500"
              }`}
          >
            Bạn sẽ được chuyển đến trang VNPay để hoàn tất thanh toán an toàn
          </p>

          {/* Supported Payment Methods */}
          <div className="mt-6 pt-6 border-t border-gray-200/20">
            <p
              className={`text-xs text-center mb-3 ${isDarkMode ? "text-gray-500" : "text-gray-500"
                }`}
            >
              Hỗ trợ thanh toán qua:
            </p>
            <div className="flex justify-center items-center gap-4 flex-wrap">
              {["Thẻ ATM", "Visa/Master", "QR Code"].map((method) => (
                <div
                  key={method}
                  className="px-3 py-2 bg-white rounded-lg shadow-sm"
                >
                  <span className="text-xs font-semibold text-gray-700">
                    {method}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Processing Step ── */}
      {step === "processing" && (
        <div className="text-center py-8">
          <Loader2 className="w-16 h-16 text-cyan-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold mb-2">Đang xử lý thanh toán</h3>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Vui lòng đợi trong giây lát...
          </p>
        </div>
      )}
    </div>
  );
}
