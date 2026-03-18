import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */


/* ===================== TYPES ===================== */

export type PaymentStatus =
    | "PENDING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED";

export type ProductType =
    | "COURSE"
    | "VIP_PACKAGE";

export interface OrderItemResponse {
    id: string;
    productType: ProductType;
    courseId: string | null;
    courseName: string | null;
    vipPackageId: string | null;
    vipPackageName: string | null;
    price: number;
}

export interface OrderResponse {
    orderId: string;
    orderCode: string;
    amount: number;
    paymentMethod: string;
    transactionNo: string;
    status: PaymentStatus;
    createdAt: string;
    paidAt: string;
    items: OrderItemResponse[];
}

/* ===================== SERVICE ===================== */

export const orderService = {
    /**
     * 📄 Lấy danh sách hóa đơn của user
     */
    getMyOrders(): Promise<OrderResponse[]> {
        return http.get<OrderResponse[]>(
            API_ENDPOINTS.ORDER.MY_ORDERS
        );
    },

    getMyOrderDetail(orderCode: string): Promise<OrderResponse> {
        return http.get<OrderResponse>(
            API_ENDPOINTS.ORDER.MY_ORDER_DETAIL(orderCode)
        );
    },
};