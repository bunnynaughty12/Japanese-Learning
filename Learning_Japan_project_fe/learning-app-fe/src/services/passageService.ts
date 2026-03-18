import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

export interface PassageResponse {
    id: string;
    title: string;
    content: string;
    passageOrder: number;

}
export interface UpdatePassageRequest {
    title: string;
    content: string;
    passageOrder: number;
}

export const passageService = {
    getById(id: string): Promise<PassageResponse> {
        return http.get<PassageResponse>(API_ENDPOINTS.PASSAGE.GET_BY_ID(id));
    },
    update(id: string, passage: UpdatePassageRequest): Promise<PassageResponse> {
        return http.put<PassageResponse>(API_ENDPOINTS.PASSAGE.UPDATE(id), passage);
    },
    delete(id: string): Promise<void> {
        return http.delete<void>(API_ENDPOINTS.PASSAGE.DELETE(id));
    },
}