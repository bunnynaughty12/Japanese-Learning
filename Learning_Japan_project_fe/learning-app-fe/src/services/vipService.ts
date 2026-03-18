// src/services/vipService.ts

import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export type PlanType = "MONTHLY" | "YEARLY" | "LIFETIME";

export interface VipPackageResponse {
  id: string;
  planType: PlanType;
  name: string;
  price: number;
  durationDays: number | null;
  active: boolean;
}

export interface CreateVipPackageRequest {
  planType: PlanType;
  name: string;
  price: number;
  durationDays?: number | null;
  active?: boolean;
}

export interface PurchaseVipRequest {
  packageId: string;
}

export interface MyVipResponse {
  packageName: string;
  planType: PlanType;
  startDate: string;
  expiryDate: string | null;
  active: boolean;
}

/* ===================== SERVICE ===================== */

export const vipService = {
  /**
   * Lấy tất cả VIP packages (active)
   */
  getAll(): Promise<VipPackageResponse[]> {
    return http.get<VipPackageResponse[]>(API_ENDPOINTS.VIP.GET_ALL);
  },

  /**
   * ADMIN tạo VIP package
   */
  create(request: CreateVipPackageRequest): Promise<void> {
    return http.post<void>(API_ENDPOINTS.VIP.CREATE, request);
  },

  /**
   * User mua VIP
   */
  purchase(request: PurchaseVipRequest): Promise<void> {
    return http.post<void>(API_ENDPOINTS.VIP.PURCHASE, request);
  },

  /**
   * Lấy thông tin VIP hiện tại của user
   */
  getMyVip(): Promise<MyVipResponse> {
    return http.get<MyVipResponse>(API_ENDPOINTS.VIP.GET_MY_VIP);
  },

  /**
   * ADMIN cập nhật VIP package
   */
  update(id: string, request: CreateVipPackageRequest): Promise<void> {
    return http.put<void>(API_ENDPOINTS.VIP.UPDATE(id), request);
  },

  /**
   * ADMIN xóa VIP package
   */
  delete(id: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.VIP.DELETE(id));
  },
};
