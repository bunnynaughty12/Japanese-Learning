import { LearningStatus } from "@/enums/LearningStatus";
import axios from "axios";

export type VocabStatusResponse = {
  vocabId: number;
  status: LearningStatus;
};

export const getVocabStatus = async (
  vocabId: number
): Promise<VocabStatusResponse> => {
  const res = await axios.get(`/api/v1/vocab/${vocabId}/status`);

  return res.data.data; // ApiResponse<T>
};
