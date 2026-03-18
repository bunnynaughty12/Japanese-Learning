import { create } from "zustand";
import { SubmitExamResponse } from "@/services/examService";

interface ExamResultStore {
  result: SubmitExamResponse | null;
  setResult: (res: SubmitExamResponse) => void;
  resetResult: () => void;
}

export const useExamResultStore = create<ExamResultStore>((set) => ({
  result: null,
  setResult: (res) => set({ result: res }),
  resetResult: () => set({ result: null }),
}));
