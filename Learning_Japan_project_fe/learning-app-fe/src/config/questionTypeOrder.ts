import { AssessmentType } from "@/enums/assessmentType";

export interface QuestionTypeOrder {
  key: string; // question.questionType từ API
  label: string; // 問題X
  assessmentType: AssessmentType;
}

/**
 * Thứ tự chuẩn JLPT N5 – Language Knowledge + Reading
 */
export const QUESTION_TYPE_ORDER: QuestionTypeOrder[] = [
  {
    key: "KANJI_READING",
    label: "問題",
    assessmentType: AssessmentType.KANJI_READING,
  },
  {
    key: "KANJI_MEMORY",
    label: "問題",
    assessmentType: AssessmentType.KANJI_MEMORY,
  },
  {
    key: "VOCAB_CONTEXT",
    label: "問題",
    assessmentType: AssessmentType.VOCAB_CONTEXT,
  },
  {
    key: "GRAMMAR_SELECT",
    label: "問題",
    assessmentType: AssessmentType.FILL_BLANK,
  },
  {
    key: "SENTENCE_ORDER",
    label: "問題",
    assessmentType: AssessmentType.SENTENCE_ORDER,
  },
  {
    key: "PARAPHRASE",
    label: "問題",
    assessmentType: AssessmentType.FILL_BLANK,
  },
  {
    key: "TEXT_COMPLETION",
    label: "問題",
    assessmentType: AssessmentType.FILL_BLANK,
  },
  {
    key: "READING_SHORT",
    label: "問題",
    assessmentType: AssessmentType.READING_SHORT,
  },
  {
    key: "READING_MEDIUM",
    label: "問題",
    assessmentType: AssessmentType.READING_SHORT,
  },
];
