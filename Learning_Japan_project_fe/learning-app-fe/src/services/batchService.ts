import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { BatchJobType } from "@/enums/BatchJobType";
export interface BatchRunResponse {
    message: string;
    result: string;
}
export const batchService = {
    runJob: async (jobType: BatchJobType) => {
        return http.post(API_ENDPOINTS.BATCH.RUN, null, {
            params: { jobType },
        });
    },
};