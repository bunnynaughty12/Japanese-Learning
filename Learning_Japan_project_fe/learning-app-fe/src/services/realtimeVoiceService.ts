import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export type RealtimeEvent = {
  type: string;
  delta?: string;
  transcript?: string;
  text?: string;
  [key: string]: unknown;
};

export type VoiceCallbacks = {
  onStatus?: (status: string) => void;
  onEvent?: (event: RealtimeEvent) => void;
};

export interface RealtimeTokenResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
}

/* ===================== SERVICE ===================== */

class RealtimeVoiceService {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audio: HTMLAudioElement | null = null;

  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;

  private isSpeaking = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private lastAudioTime = 0;

  /* =====================
   * GET TOKEN FROM BE
   * ===================== */
  private async getRealtimeToken(): Promise<RealtimeTokenResponse> {
    return http.post<RealtimeTokenResponse>(API_ENDPOINTS.AI.REALTIME_TOKEN);
  }

  /* =====================
   * START VOICE
   * ===================== */
  async start(callbacks?: VoiceCallbacks) {
    callbacks?.onStatus?.("Getting token...");
    const token = await this.getRealtimeToken();

    callbacks?.onStatus?.("Initializing WebRTC...");
    this.pc = new RTCPeerConnection();

    /* ===== AUDIO OUTPUT FROM AI ===== */
    this.audio = document.createElement("audio");
    this.audio.autoplay = true;

    this.pc.ontrack = (e) => {
      console.log("📻 Received audio track from OpenAI");
      if (this.audio && e.streams[0]) {
        this.audio.srcObject = e.streams[0];
      }
    };

    /* ===== MICROPHONE INPUT ===== */
    callbacks?.onStatus?.("Requesting microphone...");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 24000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    console.log("🎤 Microphone stream obtained");

    stream.getTracks().forEach((track) => {
      console.log("📤 Adding track to peer connection:", track.label);
      this.pc!.addTrack(track, stream);
    });

    /* ===== AUDIO PIPELINE ===== */
    this.audioContext = new AudioContext({ sampleRate: 24000 });

    try {
      await this.audioContext.audioWorklet.addModule("/pcm-processor.js");
      console.log("✅ Audio worklet loaded");
    } catch (error) {
      console.error("❌ Failed to load audio worklet:", error);
      throw error;
    }

    this.source = this.audioContext.createMediaStreamSource(stream);
    this.processor = new AudioWorkletNode(this.audioContext, "pcm-processor");

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    console.log("🔊 Audio pipeline connected");

    /* ===== DATA CHANNEL ===== */
    this.dc = this.pc.createDataChannel("oai-events");

    this.dc.onopen = () => {
      console.log("✅ Data channel opened");
      callbacks?.onStatus?.("Connected – start speaking 🎤");

      // init session
      const sessionConfig = {
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: `Bạn là MAZI AI – trợ lý giao tiếp bằng giọng nói thời gian thực.

QUY TẮC BẮT BUỘC:
- Mỗi khi nhận được một lượt nói hoàn chỉnh từ người dùng, PHẢI tạo phản hồi.
- Không được chờ thêm lượt nói khác mới phản hồi.
- Không được im lặng trong bất kỳ trường hợp nào.

CÁCH PHẢN HỒI:
- Luôn ưu tiên phản hồi bằng GIỌNG NÓI.
- Trả lời ngắn gọn, rõ ràng (1–3 câu).
- Ngôn ngữ: tiếng Việt, giọng thân thiện.

XỬ LÝ NGOẠI LỆ:
- Nếu nội dung audio không rõ, bị ngắt, hoặc không đủ thông tin:
  → nói: "Mình chưa nghe rõ, bạn nói lại giúp mình nhé."
- Nếu người dùng nói nội dung không liên quan đến học tiếng Nhật:
  → nói: "Mình là trợ lý học tiếng Nhật. Bạn muốn luyện từ vựng, ngữ pháp hay hội thoại?"

VAI TRÒ:
- Trợ lý học tiếng Nhật thân thiện
- Khuyến khích người học tiếp tục nói
- Không kết thúc hội thoại nếu chưa phản hồi xong lượt nói hiện tại`,
          voice: "alloy",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1",
          },
          turn_detection: null, // Manual mode
        },
      };

      console.log("📤 Sending session config:", sessionConfig);
      this.dc!.send(JSON.stringify(sessionConfig));
    };

    /* ===== SEND AUDIO TO OPENAI ===== */
    let audioChunkCount = 0;

    this.processor.port.onmessage = (e) => {
      if (!this.dc || this.dc.readyState !== "open") return;

      // ✅ FIX: Audio worklet already sends base64 string, not Int16Array
      const base64Audio = e.data as string;

      audioChunkCount++;
      if (audioChunkCount % 50 === 0) {
        console.log(`📤 Sent ${audioChunkCount} audio chunks`);
      }

      // Send audio chunk
      this.dc.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio,
        })
      );

      // Track speaking state
      this.lastAudioTime = Date.now();

      if (!this.isSpeaking) {
        this.isSpeaking = true;
        console.log("🎤 User started speaking");
        callbacks?.onStatus?.("🎤 Đang nghe bạn nói...");
      }

      // Clear previous timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
      }

      // Auto-commit after 0.8 seconds of silence
      this.silenceTimer = setTimeout(() => {
        console.log(
          "⏰ Silence timer fired! isSpeaking:",
          this.isSpeaking,
          "dc state:",
          this.dc?.readyState
        );
        if (this.isSpeaking && this.dc && this.dc.readyState === "open") {
          console.log(
            "🔇 Silence detected! Committing audio and requesting response..."
          );

          this.isSpeaking = false;
          callbacks?.onStatus?.("⏳ AI đang suy nghĩ...");

          // Commit the audio buffer
          this.dc.send(
            JSON.stringify({
              type: "input_audio_buffer.commit",
            })
          );

          // Request AI response
          this.dc.send(
            JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["text", "audio"],
              },
            })
          );
        }
      }, 800); // 0.8 seconds silence
    };

    /* ===== RECEIVE EVENTS ===== */
    this.dc.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as RealtimeEvent;

        console.log("📩 Event:", parsed.type, parsed);

        callbacks?.onEvent?.(parsed);

        // Track important events
        if (parsed.type === "input_audio_buffer.committed") {
          console.log("✅ Audio committed");
        }

        if (parsed.type === "response.created") {
          console.log("✅ Response created");
        }

        if (parsed.type === "response.audio.delta") {
          console.log("🔊 AI is speaking (audio chunk)");
        }

        if (parsed.type === "response.audio_transcript.done") {
          console.log("✅ AI finished speaking");
          this.isSpeaking = false;
          callbacks?.onStatus?.("Connected – start speaking 🎤");
        }

        if (parsed.type === "error") {
          console.error("❌ OpenAI Error:", parsed);
        }
      } catch {
        console.warn("⚠️ Non-JSON event:", e.data);
      }
    };

    this.dc.onerror = (error) => {
      console.error("❌ Data channel error:", error);
    };

    this.dc.onclose = () => {
      console.log("🔌 Data channel closed");
    };

    /* ===== SDP HANDSHAKE ===== */
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    console.log("📤 Sending SDP offer to OpenAI");
    callbacks?.onStatus?.("Connecting to OpenAI Realtime...");

    const sdpRes = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp!,
      }
    );

    if (!sdpRes.ok) {
      const errorText = await sdpRes.text();
      console.error("❌ SDP handshake failed:", errorText);
      throw new Error(`SDP handshake failed: ${errorText}`);
    }

    const answerSdp = await sdpRes.text();
    console.log("📥 Received SDP answer from OpenAI");

    await this.pc.setRemoteDescription({
      type: "answer",
      sdp: answerSdp,
    });

    console.log("✅ WebRTC connection established");
  }

  /* =====================
   * MANUAL COMMIT
   * ===================== */
  commitAndRequestResponse() {
    if (!this.dc || this.dc.readyState !== "open") return;

    console.log("📤 Manual commit and response request");

    this.dc.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    this.dc.send(
      JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["text", "audio"],
        },
      })
    );
  }

  /* =====================
   * STOP
   * ===================== */
  stop() {
    console.log("🛑 Stopping voice service");
    console.trace("🔍 Stop called from:");

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    this.dc?.close();
    this.pc?.close();
    this.audioContext?.close();

    this.dc = null;
    this.pc = null;
    this.audio = null;
    this.processor = null;
    this.source = null;
    this.audioContext = null;
    this.isSpeaking = false;
  }
}

export const realtimeVoiceService = new RealtimeVoiceService();
