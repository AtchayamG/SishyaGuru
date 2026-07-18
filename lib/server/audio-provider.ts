import { parseBuffer } from "music-metadata";
import OpenAI, { toFile } from "openai";
import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_DURATION_MS,
  type AudioMediaType,
  evaluateAudioPolicy,
} from "../audio-policy";
import type { TranscriptionEnvelope } from "../contract";
import { deriveWebmDurationMs } from "./webm-duration";

const PROVIDER_TIMEOUT_MS = 25_000;

function detectMediaType(bytes: Uint8Array): AudioMediaType | undefined {
  const webm = [0x1a, 0x45, 0xdf, 0xa3];
  if (webm.every((byte, index) => bytes[index] === byte)) return "audio/webm";
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return "audio/mp4";
  }
  return undefined;
}

export async function inspectAudio(bytes: Uint8Array) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_AUDIO_BYTES) return undefined;
  const mediaType = detectMediaType(bytes);
  if (!mediaType) return undefined;
  try {
    const durationMs = mediaType === "audio/webm"
      ? deriveWebmDurationMs(bytes)
      : Math.ceil(
          ((
            await parseBuffer(
              bytes,
              { mimeType: mediaType, size: bytes.byteLength },
              { duration: true, skipCovers: true },
            )
          ).format.duration ?? 0) * 1000,
        );
    if (!durationMs) return undefined;
    const policy = evaluateAudioPolicy({
      mediaType,
      byteLength: bytes.byteLength,
      durationMs,
      durationSource: "server-derived",
    });
    return policy.ok ? policy.metadata : undefined;
  } catch {
    return undefined;
  }
}

export async function transcribeLiveAudio(
  file: File,
  client: OpenAI,
  model = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
): Promise<TranscriptionEnvelope> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const media = await inspectAudio(bytes);
  if (!media || media.durationMs > MAX_AUDIO_DURATION_MS) {
    return {
      ok: false,
      providerMode: "live",
      code: "AUDIO_INVALID",
      message: "Use one WebM or MP4 recording no longer than 60 seconds and no larger than 5 MB.",
    };
  }

  try {
    const upload = await toFile(bytes, media.mediaType === "audio/webm" ? "lesson.webm" : "lesson.mp4", {
      type: media.mediaType,
    });
    const transcription = await client.audio.transcriptions.create(
      { file: upload, model, response_format: "json" },
      { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
    );
    const transcript = transcription.text.trim();
    if (!transcript || transcript.length > 4000) throw new Error("transcript rejected");
    return {
      ok: true,
      providerMode: "live",
      candidateOnly: true,
      transcript,
      media,
    };
  } catch {
    return {
      ok: false,
      providerMode: "live",
      code: "TRANSCRIPTION_ERROR",
      message: "The recording could not be transcribed. You can retry or continue by typing.",
    };
  }
}
