"use client";

import React, { useState } from "react";
import { AssessmentType } from "@/enums/assessmentType";

// ---------------------------
// Component hiển thị hướng dẫn
// ---------------------------
interface AssessmentInstructionProps {
  type: AssessmentType;
}

const instructionMap: Record<AssessmentType, string> = {
  [AssessmentType.FILL_BLANK]:
    "問題1___の言葉の読み方として最もよいものを、1から一つ選びなさい。",
  [AssessmentType.VOCAB_CONTEXT]:
    "問題2(　　)に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.SENTENCE_ORDER]:
    "問題3___の言葉の意味が最も近いものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.READING_SHORT]:
    "問題4 次の文章の内容を読んで、最も適切な答えを1から一つ選びなさい。",
  [AssessmentType.READING_DIALOGUE]:
    "問題5 会話文を読んで、空欄に入る最も適切な答えを1から一つ選びなさい。",
  [AssessmentType.READING_LETTER]: "問題6 手紙の内容を読み、設問に答えなさい。",
  [AssessmentType.READING_PERSONAL]:
    "問題7 説明文を読んで、文章の内容に最も合う答えを1から一つ選びなさい。",
  [AssessmentType.READING_PLACE]:
    "問題8 場所や環境に関する文章を読み、設問に答えなさい。",
  [AssessmentType.READING_INFO]:
    "問題9 お知らせやスケジュールを読んで、設問に答えなさい。",
  [AssessmentType.KANJI_READING]:
    "問題10 漢字の読み方として正しいものを1から一つ選びなさい。",
  [AssessmentType.KANJI_MEMORY]:
    "問題11 漢字の意味や書き順を思い出して答えなさい。",
  [AssessmentType.LISTENING_TASK]:
    "問題1 音声を聞いて、課題を理解し最適な答えを1から一つ選びなさい。",
  [AssessmentType.LISTENING_CHOICE_PREVIEW]:
    "問題2 音声を聞き、重要なポイントに基づいて答えを選びなさい。",
  [AssessmentType.LISTENING_MAIN_IDEA]:
    "問題3 音声全体の要旨を理解し、最も適切な答えを選びなさい。",
  [AssessmentType.LISTENING_RESPONSE]:
    "問題4 会話の内容に基づき、最も適切な応答を選びなさい。",
  [AssessmentType.LISTENING_INSTANT]:
    "問題X 音声を聞いて即座に答えを選びなさい。",
  [AssessmentType.LISTENING_LONG]:
    "問題5 長めの音声を聞き、内容を理解して答えを選びなさい。",
  [AssessmentType.PARAPHRASE]:
    "問題 次の（　）の言葉の意味が最も近いものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.GRAMMAR_SELECT]:
    "問題 (　　) に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.TEXT_COMPLETION]:
    "問題 次の文章の意味を考えて、(　　)に入る最もよいものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.READING_MEDIUM]:
    "問題 次の文章を読んで、後の問いに対する答えとして最もよいものを、1・2・3・4から一つ選びなさい。",
};

export function AssessmentInstruction({ type }: AssessmentInstructionProps) {
  const instruction = instructionMap[type] || "この問題の指示はありません。";
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-4">
      <p className="text-gray-800 font-medium">{instruction}</p>
    </div>
  );
}

// ---------------------------
// Component hiển thị câu hỏi
// ---------------------------
interface QuestionProps {
  questionText: string;
  options: string[];
  onAnswer?: (selectedIndex: number) => void;
}

export function Question({ questionText, options, onAnswer }: QuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelected(index);
    if (onAnswer) onAnswer(index);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
      <p className="text-gray-900 mb-4">{questionText}</p>
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`text-left px-4 py-2 rounded-md border transition 
              ${selected === idx
                ? "bg-teal-500 text-white border-teal-500"
                : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
              }`}
          >
            {`${idx + 1}. ${opt}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------
// Component tổng hợp JLPT
// ---------------------------
interface JLPTQuestionProps {
  type: AssessmentType;
  questionText: string;
  options: string[];
  onAnswer?: (selectedIndex: number) => void;
}

export default function JLPTQuestion({
  type,
  questionText,
  options,
  onAnswer,
}: JLPTQuestionProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <AssessmentInstruction type={type} />
      <Question
        questionText={questionText}
        options={options}
        onAnswer={onAnswer}
      />
    </div>
  );
}
