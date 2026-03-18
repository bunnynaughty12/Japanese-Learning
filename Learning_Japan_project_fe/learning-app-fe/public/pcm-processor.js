class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4800; // 200ms at 24kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    console.log("✅ PCMProcessor initialized");
  }

  // Base64 encode for AudioWorklet
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 0x8000; // 32KB chunks
    let binary = "";

    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
      binary += String.fromCharCode.apply(null, chunk);
    }

    // Simple base64 encoding
    const lookup =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let base64 = "";

    for (let i = 0; i < binary.length; i += 3) {
      const a = binary.charCodeAt(i);
      const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
      const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      base64 += lookup[(bitmap >> 18) & 63];
      base64 += lookup[(bitmap >> 12) & 63];
      base64 += i + 1 < binary.length ? lookup[(bitmap >> 6) & 63] : "=";
      base64 += i + 2 < binary.length ? lookup[bitmap & 63] : "=";
    }

    return base64;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (!input || !input[0]) {
      return true;
    }

    const samples = input[0];

    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.bufferIndex++] = samples[i];

      if (this.bufferIndex >= this.bufferSize) {
        // Convert Float32 to PCM16
        const pcm16 = new Int16Array(this.bufferSize);

        for (let j = 0; j < this.bufferSize; j++) {
          const s = Math.max(-1, Math.min(1, this.buffer[j]));
          pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const base64 = this.arrayBufferToBase64(pcm16.buffer);

        // Send to main thread
        this.port.postMessage(base64);

        // Reset buffer
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
