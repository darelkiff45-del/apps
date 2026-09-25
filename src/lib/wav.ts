"use client";

/** Convertit n'importe quel audio lisible par le navigateur en WAV mono 16 bits (format exigé par Higgsfield Speak). */
export async function toWav(blob: Blob): Promise<{ dataUrl: string; seconds: number }> {
  const ctx = new AudioContext();
  try {
    const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
    const rate = audio.sampleRate;
    const length = audio.length;
    const mono = new Float32Array(length);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const data = audio.getChannelData(c);
      for (let i = 0; i < length; i++) mono[i] += data[i] / audio.numberOfChannels;
    }
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    const str = (o: number, s: string) => [...s].forEach((ch, i) => view.setUint8(o + i, ch.charCodeAt(0)));
    str(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    str(8, "WAVE");
    str(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, "data");
    view.setUint32(40, length * 2, true);
    for (let i = 0; i < length; i++) {
      const s = Math.max(-1, Math.min(1, mono[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { dataUrl: `data:audio/wav;base64,${btoa(binary)}`, seconds: audio.duration };
  } finally {
    ctx.close();
  }
}
