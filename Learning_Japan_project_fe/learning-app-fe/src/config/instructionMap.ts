// /config/instructionMap.ts
import { AssessmentType } from "@/enums/assessmentType";

export const instructionMap: Partial<Record<AssessmentType, string>> = {
  // KANJI
  [AssessmentType.KANJI_READING]: "問題 漢字の読み方として正しいものを1から一つ選びなさい。",
  [AssessmentType.KANJI_MEMORY]: "問題 漢字の意味や書き順を思い出して答えなさい。",
  [AssessmentType.KANJI_STROKE_ORDER]: "問題 漢字の書き順として正しいものを1から一つ選びなさい。",
  [AssessmentType.KANJI_MULTIPLE_READING]: "問題 漢字の複数の読み方の中で、文脈に合うものを一つ選びなさい。",

  // VOCABULARY
  [AssessmentType.VOCAB_CONTEXT]: "問題(　　)に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.VOCAB_SYNONYM]: "問題 次の言葉と意味が最も近いものを一つ選びなさい。",
  [AssessmentType.VOCAB_CHOOSE_BEST]: "問題 選択肢の中から最も適切な言葉を一つ選びなさい。",
  [AssessmentType.VOCAB_FIND_USAGE]: "問題 次の言葉の使い方が最も正しいものを一つ選びなさい。",
  [AssessmentType.VOCAB_ANTONYM]: "問題 次の言葉の反対の意味を持つものを一つ選びなさい。",
  [AssessmentType.VOCAB_EXACT_MATCH]: "問題 次の意味に最も合う言葉を一つ選びなさい。",
  [AssessmentType.VOCAB_CONTEXT_NUANCE]: "問題 文脈に最も合うニュアンスの言葉を一つ選びなさい。",
  [AssessmentType.VOCAB_COLLOCATION]: "問題 一緒によく使われる言葉の組み合わせとして正しいものを一つ選びなさい。",
  [AssessmentType.VOCAB_FORMAL_CASUAL]: "問題 言葉の丁寧さ（フォーマル・カジュアル）が文脈に合うものを一つ選びなさい。",
  [AssessmentType.VOCAB_REGISTER]: "問題 場面や相手に最もふさわしい言葉を一つ選びなさい。",
  [AssessmentType.VOCAB_NUANCE_DIFFERENCE]: "問題 似ている言葉のニュアンスの違いを考え、最も適切なものを一つ選びなさい。",
  [AssessmentType.VOCAB_IDIOMATIC]: "問題 慣用句として正しいものを一つ選びなさい。",
  [AssessmentType.VOCAB_SPECIALIZED]: "問題 専門的な言葉の意味として最も適切なものを一つ選びなさい。",

  // GRAMMAR
  [AssessmentType.FILL_BLANK]: "問題___の言葉の読み方として最もよいものを、1から一つ選びなさい。",
  [AssessmentType.SENTENCE_ORDER]: "問題___の言葉の意味が最も近いものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.PARAPHRASE]: "問題 次の（　）の言葉の意味が最も近いものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.GRAMMAR_SELECT]: "問題 (　　) に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.TEXT_COMPLETION]: "問題 次の文章の意味を考えて、(　　)に入る最もよいものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.GRAMMAR_MEANING]: "問題 次の文法が表す意味として最も適切なものを一つ選びなさい。",
  [AssessmentType.GRAMMAR_NUANCE]: "問題 文法のニュアンスとして最もふさわしいものを一つ選びなさい。",
  [AssessmentType.GRAMMAR_SENTENCE_PATTERN]: "問題 次の文型を使って文を完成させなさい。",
  [AssessmentType.GRAMMAR_CAUSATIVE_PASSIVE]: "問題 使役・受身の意味として最も適切なものを一つ選びなさい。",
  [AssessmentType.GRAMMAR_CONDITIONAL]: "問題 条件を表す文法として最も適切なものを一つ選びなさい。",
  [AssessmentType.GRAMMAR_ADVANCED]: "問題 高度な文法表現として最も適切なものを一つ選びなさい。",
  [AssessmentType.GRAMMAR_CLASSICAL]: "問題 古典的な文法表現の意味として最も適切なものを一つ選びなさい。",

  // READING
  [AssessmentType.READING_SHORT]: "問題 次の文章の内容を読んで、最も適切な答えを1から一つ選びなさい。",
  [AssessmentType.READING_DIALOGUE]: "問題 会話文を読んで、空欄に入る最も適切な答えを1から一つ選びなさい。",
  [AssessmentType.READING_LETTER]: "問題 手紙の内容を読み、設問に答えなさい。",
  [AssessmentType.READING_PERSONAL]: "問題 説明文を読んで、文章の内容に最も合う答えを1から一つ選びなさい。",
  [AssessmentType.READING_PLACE]: "問題 場所や環境に関する文章を読み、設問に答えなさい。",
  [AssessmentType.READING_INFO]: "問題 お知らせやスケジュールを読んで、設問に答えなさい。",
  [AssessmentType.READING_MEDIUM]: "問題 次の文章を読んで、後の問いに対する答えとして最もよいものを、1・2・3・4から一つ選びなさい。",
  [AssessmentType.READING_COMPARISON]: "問題 複数の文章を読み比べ、設問に答えなさい。",
  [AssessmentType.READING_INFO_SEARCH]: "問題 必要な情報を探し出し、設問に答えなさい。",
  [AssessmentType.READING_NUANCE]: "問題 筆者のニュアンスや意図を読み取り、設問に答えなさい。",
  [AssessmentType.READING_LOGICAL_FLOW]: "問題 文章の論理的な流れを理解し、設問に答えなさい。",
  [AssessmentType.READING_OPINION_ANALYSIS]: "問題 筆者の意見や主張を分析し、最も適切な答えを選びなさい。",
  [AssessmentType.READING_CRITICAL]: "問題 文章に対して批判的に思考し、設問に答えなさい。",
  [AssessmentType.READING_IMPLICATION]: "問題 文章から暗示されている内容を読み取り、答えなさい。",
  [AssessmentType.READING_LONG_ESSAY]: "問題 長文のエッセイを読み、全体の趣旨や詳細に関する設問に答えなさい。",
  [AssessmentType.READING_ACADEMIC]: "問題 学術的な文章を読み、設問に答えなさい。",

  // LISTENING
  [AssessmentType.LISTENING_TASK]: "問題 音声を聞いて、課題を理解し最適な答えを1から一つ選びなさい。",
  [AssessmentType.LISTENING_MAIN_POINT]: "問題 音声を聞き、重要なポイントに基づいて答えを選びなさい。",
  [AssessmentType.LISTENING_MAIN_IDEA]: "問題 音声全体の要旨を理解し、最も適切な答えを選びなさい。",
  [AssessmentType.LISTENING_CORRECT_RESPONSE]: "問題 会話の内容に基づき、最も適切な応答を選びなさい。",
  [AssessmentType.LISTENING_UNDERSTAND_KEY]: "問題 音声からキーワードを聞き取り、設問に答えなさい。",
  [AssessmentType.LISTENING_COMPREHENSIVE]: "問題 音声の全体を総合的に理解し、設問に答えなさい。",
  [AssessmentType.LISTENING_DETAIL]: "問題 音声の細かい部分に注意して聞き、答えを選びなさい。",
  [AssessmentType.LISTENING_RELATIONSHIP]: "問題 登場人物の関係性や状況を理解し、答えを選びなさい。",
  [AssessmentType.LISTENING_IMPLICIT]: "問題 音声に直接言われていない暗示された内容を理解し、答えなさい。",
  [AssessmentType.LISTENING_NUANCE_TONE]: "問題 話し手の声のトーンやニュアンスから意図を読み取りなさい。",
  [AssessmentType.LISTENING_INFERENCE]: "問題 音声の内容から推測できることを選びなさい。",
  [AssessmentType.LISTENING_LONG_LECTURE]: "問題 長い講義や話を聴き、その内容についての設問に答えなさい。",
  [AssessmentType.LISTENING_COMPLEX]: "問題 複雑な状況の音声を聞き、条件に合うものを一つ選びなさい。",
  [AssessmentType.LISTENING_SPECIALIZED]: "問題 専門的な内容の音声を聞き、理解して設問に答えなさい。",
};
