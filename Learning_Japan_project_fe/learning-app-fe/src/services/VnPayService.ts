import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export type PlanType = "MONTHLY" | "YEARLY" | "LIFETIME";
export type ProductType = "VIP_PACKAGE" | "COURSE";



export interface CreateVnPayRequest {
  productId: string;
  productType: ProductType;
}

export interface CreateVnPayResponse {
  paymentUrl: string;
}

export interface OrderSuccessResponse {
  orderId: string;
  orderCode: string;
  amount: number;
  paymentMethod: string;
  transactionNo: string;
  paidAt: string;
  expiredAt?: string | null;

  vipPackageId?: string | null;
  packageName?: string | null;
  planType?: PlanType | null;
  durationDays?: number | null;
}

/* ===================== SERVICE ===================== */

export const vnPayService = {
  /**
   * Tạo link thanh toán (VIP hoặc COURSE)
   */
  async create(request: CreateVnPayRequest): Promise<CreateVnPayResponse> {
    return http.post<CreateVnPayResponse>(
      API_ENDPOINTS.PAYMENT.VNPAY_CREATE,
      request
    );
  },

  /**
   * Xử lý return từ VNPAY
   */
  handleReturn(queryString: string): Promise<OrderSuccessResponse> {
    return http.get<OrderSuccessResponse>(
      `${API_ENDPOINTS.PAYMENT.VNPAY_RETURN}?${queryString}`
    );
  },
};