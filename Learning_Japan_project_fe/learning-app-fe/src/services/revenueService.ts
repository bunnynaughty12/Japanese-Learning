import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface RevenueSummaryResponse {
    totalRevenue: number;
    todayRevenue: number;
    monthRevenue: number;
    totalSuccessOrders: number;
    generatedAt: string;
}

/* ===================== SERVICE ===================== */

export const revenueService = {
    /**
     * 📊 Lấy dashboard revenue tổng quan
     */
    getSummary(): Promise<RevenueSummaryResponse> {
        return http.get<RevenueSummaryResponse>(
            API_ENDPOINTS.REVENUE.SUMMARY
        );
    },

    /**
     * 📅 Lấy doanh thu theo ngày
     */
    getByDay(date: string): Promise<number> {
        return http.get<number>(
            API_ENDPOINTS.REVENUE.BY_DAY(date)
        );
    },

    /**
     * 📆 Lấy doanh thu theo tháng
     */
    getByMonth(
        year: number,
        month: number
    ): Promise<number> {
        return http.get<number>(
            API_ENDPOINTS.REVENUE.BY_MONTH(year, month)
        );
    },

    /**
     * 📦 Tổng số đơn thành công
     */
    getSuccessCount(): Promise<number> {
        return http.get<number>(
            API_ENDPOINTS.REVENUE.SUCCESS_COUNT
        );
    },
};