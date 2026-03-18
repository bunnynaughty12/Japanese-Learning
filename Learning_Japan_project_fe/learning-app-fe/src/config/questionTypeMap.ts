// src/config/questionTypeMap.ts
import { AssessmentType } from "@/enums/assessmentType";

export const typeInstructionStyles: Partial<Record<
  AssessmentType,
  { bg: string; text: string; instruction: string }
>> = {
  // ===== KANJI =====
  [AssessmentType.KANJI_READING]: { bg: "bg-gray-200", text: "text-black", instruction: "漢字を読んで、意味や読み方を選んでください。" },
  [AssessmentType.KANJI_MEMORY]: { bg: "bg-gray-200", text: "text-black", instruction: "漢字の形や意味を思い出して答えてください。" },
  [AssessmentType.KANJI_STROKE_ORDER]: { bg: "bg-gray-200", text: "text-black", instruction: "漢字の書き順として正しいものを選んでください。" },
  [AssessmentType.KANJI_MULTIPLE_READING]: { bg: "bg-gray-200", text: "text-black", instruction: "文脈に合う漢字の読み方を選んでください。" },

  // ===== VOCABULARY =====
  [AssessmentType.VOCAB_CONTEXT]: { bg: "bg-gray-200", text: "text-black", instruction: "もんだい2: ____★____に何を入れますか。1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.VOCAB_SYNONYM]: { bg: "bg-gray-200", text: "text-black", instruction: "言葉と意味が最も近いものを一つ選んでください。" },
  [AssessmentType.VOCAB_CHOOSE_BEST]: { bg: "bg-gray-200", text: "text-black", instruction: "選択肢の中から最も適切な言葉を一つ選んでください。" },
  [AssessmentType.VOCAB_FIND_USAGE]: { bg: "bg-gray-200", text: "text-black", instruction: "言葉の使い方が最も正しいものを一つ選んでください。" },
  [AssessmentType.VOCAB_ANTONYM]: { bg: "bg-gray-200", text: "text-black", instruction: "言葉の反対の意味を持つものを一つ選んでください。" },
  [AssessmentType.VOCAB_EXACT_MATCH]: { bg: "bg-gray-200", text: "text-black", instruction: "意味に最も合う言葉を一つ選んでください。" },
  [AssessmentType.VOCAB_CONTEXT_NUANCE]: { bg: "bg-gray-200", text: "text-black", instruction: "文脈に最も合うニュアンスの言葉を選んでください。" },
  [AssessmentType.VOCAB_COLLOCATION]: { bg: "bg-gray-200", text: "text-black", instruction: "一緒によく使われる言葉の組み合わせを選んでください。" },
  [AssessmentType.VOCAB_FORMAL_CASUAL]: { bg: "bg-gray-200", text: "text-black", instruction: "丁寧さが文脈に合うものを選んでください。" },
  [AssessmentType.VOCAB_REGISTER]: { bg: "bg-gray-200", text: "text-black", instruction: "場面や相手に最もふさわしい言葉を選んでください。" },
  [AssessmentType.VOCAB_NUANCE_DIFFERENCE]: { bg: "bg-gray-200", text: "text-black", instruction: "似ている言葉のニュアンスの違いを考え、適切なものを選んでください。" },
  [AssessmentType.VOCAB_IDIOMATIC]: { bg: "bg-gray-200", text: "text-black", instruction: "慣用句として正しいものを選んでください。" },
  [AssessmentType.VOCAB_SPECIALIZED]: { bg: "bg-gray-200", text: "text-black", instruction: "専門的な言葉の意味として最も適切なものを選んでください。" },

  // ===== GRAMMAR =====
  [AssessmentType.FILL_BLANK]: { bg: "bg-gray-900", text: "text-white", instruction: "もんだい1（　）に何を入れますか。1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.SENTENCE_ORDER]: { bg: "bg-gray-200", text: "text-black", instruction: "もんだい3: １から５に何を入れますか。文章の意味を考えて、1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.PARAPHRASE]: { bg: "bg-gray-200", text: "text-black", instruction: "問題 次の（　）の言葉の意味が最も近いものを、1・2・3・4から一つ選びなさい。" },
  [AssessmentType.GRAMMAR_SELECT]: { bg: "bg-gray-200", text: "text-black", instruction: "問題 (　　) に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。" },
  [AssessmentType.TEXT_COMPLETION]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 次の文章の意味を考えて、(　　)に入る最もよいものを、1・2・3・4から一つ選びなさい。" },
  [AssessmentType.GRAMMAR_MEANING]: { bg: "bg-gray-200", text: "text-black", instruction: "文法が表す意味として最も適切なものを選んでください。" },
  [AssessmentType.GRAMMAR_NUANCE]: { bg: "bg-gray-200", text: "text-black", instruction: "文法のニュアンスとして最もふさわしいものを選んでください。" },
  [AssessmentType.GRAMMAR_SENTENCE_PATTERN]: { bg: "bg-gray-200", text: "text-black", instruction: "文型を使って文を完成させてください。" },
  [AssessmentType.GRAMMAR_CAUSATIVE_PASSIVE]: { bg: "bg-gray-200", text: "text-black", instruction: "使役・受身の意味として最も適切なものを選んでください。" },
  [AssessmentType.GRAMMAR_CONDITIONAL]: { bg: "bg-gray-200", text: "text-black", instruction: "条件を表す文法として最も適切なものを選んでください。" },
  [AssessmentType.GRAMMAR_ADVANCED]: { bg: "bg-gray-200", text: "text-black", instruction: "高度な文法表現として最も適切なものを選んでください。" },
  [AssessmentType.GRAMMAR_CLASSICAL]: { bg: "bg-gray-200", text: "text-black", instruction: "古典的な文法表現の意味として最も適切なものを選んでください。" },

  // ===== READING =====
  [AssessmentType.READING_SHORT]: { bg: "bg-gray-100", text: "text-black", instruction: "もんだい4: 次の文章を読んで質問に答えてください。答えは1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.READING_DIALOGUE]: { bg: "bg-gray-100", text: "text-black", instruction: "もんだい5: 次の会話を読んで質問に答えてください。答えは1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.READING_LETTER]: { bg: "bg-gray-100", text: "text-black", instruction: "もんだい6: 次の手紙やメッセージを読んで質問に答えてください。答えは1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.READING_PERSONAL]: { bg: "bg-gray-100", text: "text-black", instruction: "もんだい7: 次の文章を読んで質問に答えてください。答えは1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.READING_PLACE]: { bg: "bg-gray-100", text: "text-black", instruction: "もんだい8: 次の文章を読んで質問に答えてください。答えは1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.READING_INFO]: { bg: "bg-gray-100", text: "text-black", instruction: "もんだい9: 次の文章を読んで質問に答えてください。答えは1・2・3・4からいちばんいいものを一つえらんでください。" },
  [AssessmentType.READING_MEDIUM]: { bg: "bg-gray-100", text: "text-black", instruction: "問題 次の文章を読んで、後の問いに対する答えとして最もよいものを、1・2・3・4から一つ選びなさい。" },
  [AssessmentType.READING_COMPARISON]: { bg: "bg-gray-100", text: "text-black", instruction: "複数の文章を読み比べ、設問に答えてください。" },
  [AssessmentType.READING_INFO_SEARCH]: { bg: "bg-gray-100", text: "text-black", instruction: "必要な情報を探し出し、設問に答えてください。" },
  [AssessmentType.READING_NUANCE]: { bg: "bg-gray-100", text: "text-black", instruction: "筆者のニュアンスや意図を読み取り、設問に答えてください。" },
  [AssessmentType.READING_LOGICAL_FLOW]: { bg: "bg-gray-100", text: "text-black", instruction: "文章の論理的な流れを理解し、設問に答えてください。" },
  [AssessmentType.READING_OPINION_ANALYSIS]: { bg: "bg-gray-100", text: "text-black", instruction: "筆者の意見や主張を分析し、最も適切な答えを選んでください。" },
  [AssessmentType.READING_CRITICAL]: { bg: "bg-gray-100", text: "text-black", instruction: "文章に対して批判的に思考し、設問に答えてください。" },
  [AssessmentType.READING_IMPLICATION]: { bg: "bg-gray-100", text: "text-black", instruction: "文章から暗示されている内容を読み取り、答えてください。" },
  [AssessmentType.READING_LONG_ESSAY]: { bg: "bg-gray-100", text: "text-black", instruction: "長文のエッセイを読み、全体の趣旨や詳細に関する設問に答えてください。" },
  [AssessmentType.READING_ACADEMIC]: { bg: "bg-gray-100", text: "text-black", instruction: "学術的な文章を読み、設問に答えてください。" },

  // ===== LISTENING =====
  [AssessmentType.LISTENING_TASK]: { bg: "bg-blue-900", text: "text-white", instruction: "問題1では、まず質問を聞いてください。それから話を聞いて、問題用紙の1から4の中から、最もよいものを一つ選んでください。" },
  [AssessmentType.LISTENING_MAIN_POINT]: { bg: "bg-blue-800", text: "text-white", instruction: "問題 音声を聞き、重要なポイントに基づいて答えを選んでください。" },
  [AssessmentType.LISTENING_MAIN_IDEA]: { bg: "bg-blue-700", text: "text-white", instruction: "問題 音声全体の要旨を理解し、最も適切な答えを選んでください。" },
  [AssessmentType.LISTENING_CORRECT_RESPONSE]: { bg: "bg-blue-600", text: "text-white", instruction: "問題 会話の内容に基づき、最も適切な応答を選んでください。" },
  [AssessmentType.LISTENING_UNDERSTAND_KEY]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 音声から重要なトピックやキーワードを聞き取り、設問に答えてください。" },
  [AssessmentType.LISTENING_COMPREHENSIVE]: { bg: "bg-blue-500", text: "text-white", instruction: "問題 音声の全体を総合的に理解し、設問に答えてください。" },
  [AssessmentType.LISTENING_DETAIL]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 音声の細かい部分に注意して聞き、答えを選んでください。" },
  [AssessmentType.LISTENING_RELATIONSHIP]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 登場人物の関係性や状況を理解し、答えを選んでください。" },
  [AssessmentType.LISTENING_IMPLICIT]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 音声に直接言われていない暗示された内容を理解し、答えてください。" },
  [AssessmentType.LISTENING_NUANCE_TONE]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 話し手の声のトーンやニュアンスから意図を読み取ってください。" },
  [AssessmentType.LISTENING_INFERENCE]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 音声の内容から推測できることを選んでください。" },
  [AssessmentType.LISTENING_LONG_LECTURE]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 長い講義や話を聴き、その内容についての設問に答えてください。" },
  [AssessmentType.LISTENING_COMPLEX]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 複雑な状況の音声を聞き、条件に合うものを一つ選んでください。" },
  [AssessmentType.LISTENING_SPECIALIZED]: { bg: "bg-blue-900", text: "text-white", instruction: "問題 専門的な内容の音声を聞き、理解して設問に答えてください。" },
};
