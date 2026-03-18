// app/api/transcript/route.ts
import { YoutubeTranscript } from "youtube-transcript";

// Interface cho 1 dòng transcript
export interface TranscriptItem {
  offset: number; // thời gian tính bằng giây
  text: string; // văn bản Nhật
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return new Response(
      JSON.stringify({ data: [], message: "Missing videoId" }),
      { status: 400 }
    );
  }

  try {
    const transcript: TranscriptItem[] =
      await YoutubeTranscript.fetchTranscript(videoId, {
        lang: "ja",
      });

    return new Response(JSON.stringify({ data: transcript }));
  } catch (e) {
    // Nếu transcript không có hoặc lỗi, trả về array rỗng
    return new Response(JSON.stringify({ data: [] }));
  }
}
