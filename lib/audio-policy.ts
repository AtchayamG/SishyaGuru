import { z } from "zod";

/**
 * Bounded-audio policy (blueprint §6.1 rule 0, voice architecture).
 * Constants and types only — media parsing and the transcribe route are M3+.
 */

export const AUDIO_MEDIA_TYPES = ["audio/webm", "audio/mp4"] as const;
export const AudioMediaTypeSchema = z.enum(AUDIO_MEDIA_TYPES);
export type AudioMediaType = z.infer<typeof AudioMediaTypeSchema>;

export const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_AUDIO_DURATION_MS = 60_000; // 60 seconds

/**
 * Metadata the server itself derived from the audio container. The literal
 * `durationSource: "server-derived"` makes client-supplied duration metadata
 * unrepresentable at the type/schema level: forged client MIME or duration
 * cannot satisfy this contract.
 */
export const ServerAudioMetadataSchema = z.strictObject({
  mediaType: AudioMediaTypeSchema, // normalized server-side, exact allowlist
  byteLength: z.number().int().positive().max(MAX_AUDIO_BYTES),
  durationMs: z.number().int().positive().max(MAX_AUDIO_DURATION_MS),
  durationSource: z.literal("server-derived"),
});
export type ServerAudioMetadata = z.infer<typeof ServerAudioMetadataSchema>;

export type AudioPolicyResult =
  | { ok: true; metadata: ServerAudioMetadata }
  | { ok: false; code: "AUDIO_INVALID" };

/** Accepts only allow-listed, bounded, server-derived audio metadata. */
export function evaluateAudioPolicy(candidate: unknown): AudioPolicyResult {
  const parsed = ServerAudioMetadataSchema.safeParse(candidate);
  return parsed.success
    ? { ok: true, metadata: parsed.data }
    : { ok: false, code: "AUDIO_INVALID" };
}
