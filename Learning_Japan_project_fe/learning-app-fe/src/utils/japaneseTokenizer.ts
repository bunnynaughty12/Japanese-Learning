// utils/japaneseTokenizer.ts
import TinySegmenter from "tiny-segmenter";

const segmenter = new TinySegmenter();

export function tokenizeJapanese(text: string): string[] {
  return segmenter.segment(text);
}
