// src/services/examService.ts
import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface SectionWithQuestionsResponse {
  id: string;
  examId: string;
  title: string;
  sectionDuration: number;
  sectionOrder: number;
  questions: {
    id: string;
    sectionOrder: number;
    questionType: string;
    questionText: string;
    options: string[];
    answer: string;
    imageUrl: string;
    audioUrl: string;
    questionOrder: number;
    passageTitle?: string;
    passageContent?: string;
  }[];
}

export interface ExamResponse {
  id: string;
  code: string;
  level: string;
  participant: number;
  duration: number;
  numSections: number;
  numQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface StartExamRequest {
  examId: string;
}

export interface StartExamResponse {
  participantId: string;
  examId: string;
  examCode: string;
  duration: number;
  userId: string;
  completed: boolean;
  startedAt: string;
}

export interface SubmitExamRequest {
  participantId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
}

export interface SubmitExamResponse {
  participantId: string;
  examId: string;
  examCode: string;
  aiReview?: string | null;
  totalScore: number;
  completed: boolean;
  answeredCount: number;
  totalQuestions: number;
  correctCount: number;
  skippedCount: number;
  startedAt: string;
  finishedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    questionType: string;
    optionsJson: string;
    correctAnswer: string;
    sectionOrder?: number;
    sectionTitle?: string;
    sectionDuration?: number;
    answer: string | null;
    isCorrect: boolean;
    score: number;
    questionOrder: number;
    explanation: string;
    imageUrl?: string;
    audioUrl?: string;
  }[];
}

/* ===================== SERVICE ===================== */

export const examService = {
  getSections(examId: string): Promise<SectionWithQuestionsResponse[]> {
    return http.get<SectionWithQuestionsResponse[]>(
      API_ENDPOINTS.EXAM.GET_SECTIONS(examId)
    );
  },

  getAll(): Promise<ExamResponse[]> {
    return http.get<ExamResponse[]>(API_ENDPOINTS.EXAM.EXAM_VIEW_ALL);
  },

  startExam(request: StartExamRequest): Promise<StartExamResponse> {
    return http.post<StartExamResponse>(
      API_ENDPOINTS.EXAM.EXAM_START,
      request
    );
  },

  submitExam(request: SubmitExamRequest): Promise<SubmitExamResponse> {
    return http.post<SubmitExamResponse>(
      API_ENDPOINTS.EXAM.EXAM_SUBMIT,
      request
    );
  },

  delete(id: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.EXAM.DELETE(id));
  },
};