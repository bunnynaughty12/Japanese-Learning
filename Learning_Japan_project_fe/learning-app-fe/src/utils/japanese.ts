/**
 * Check language code có phải tiếng Nhật không
 */
export const isJapaneseLang = (lang?: string): boolean => {
  if (!lang) return false;
  return ["ja", "jp", "ja-JP"].includes(lang);
};

/**
 * Check text có ký tự tiếng Nhật không
 * Hiragana | Katakana | Kanji
 */
export const isJapaneseText = (text?: string): boolean => {
  if (!text) return false;
  return /[\u3040-\u30ff\u4e00-\u9faf]/.test(text);
};
