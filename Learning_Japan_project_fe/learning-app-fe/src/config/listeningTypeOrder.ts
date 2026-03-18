import { AssessmentType } from "@/enums/assessmentType";
import { QuestionTypeOrder } from "./questionTypeOrder";

/**
 * Thứ tự chuẩn JLPT N5 – Listening
 */
export const LISTENING_TYPE_ORDER: QuestionTypeOrder[] = [
  {
    key: "LISTENING_INSTANT",
    label: "問題",
    assessmentType: AssessmentType.LISTENING_INSTANT,
  },
  {
    key: "LISTENING_TASK",
    label: "問題",
    assessmentType: AssessmentType.LISTENING_TASK,
  },
  {
    key: "LISTENING_CHOICE_PREVIEW",
    label: "問題",
    assessmentType: AssessmentType.LISTENING_CHOICE_PREVIEW,
  },
  {
    key: "LISTENING_MAIN_IDEA",
    label: "問題",
    assessmentType: AssessmentType.LISTENING_MAIN_IDEA,
  },
  {
    key: "LISTENING_RESPONSE",
    label: "問題",
    assessmentType: AssessmentType.LISTENING_RESPONSE,
  },
  {
    key: "LISTENING_LONG",
    label: "問題",
    assessmentType: AssessmentType.LISTENING_LONG,
  },
];
