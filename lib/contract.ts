import { z } from "zod";
import {
  ServerAudioMetadataSchema,
} from "./audio-policy";

/**
 * The one source of the SishyaGuru domain contract (blueprint §6, ADR-002).
 * Every type below is inferred from its Zod schema; there is no second
 * hand-written interface to drift. Strict objects: unknown fields reject.
 */

// ---- Shared domain ----

export const MASTERY_STATES = [
  "unassessed",
  "insufficient_evidence",
  "emerging",
  "developing",
  "secure",
] as const;
export const MasteryStateSchema = z.enum(MASTERY_STATES);
export type MasteryState = z.infer<typeof MasteryStateSchema>;

/** States that require a verbatim evidence quote (blueprint §2.1). */
export const JUDGED_STATES = ["emerging", "developing", "secure"] as const;
export type JudgedState = (typeof JUDGED_STATES)[number];

export const ConceptNodeSchema = z.strictObject({
  id: z.string().min(1), // stable slug, e.g. "evaporation"
  label: z.string().min(1),
});
export type ConceptNode = z.infer<typeof ConceptNodeSchema>;

export const ProviderModeSchema = z.enum(["live", "replay"]);
export type ProviderMode = z.infer<typeof ProviderModeSchema>;

// ---- Safe error codes (blueprint §14) ----

export const ErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "PROVIDER_TIMEOUT",
  "PROVIDER_ERROR",
  "SCHEMA_INVALID",
  "RATE_LIMITED",
  "MICROPHONE_DENIED",
  "AUDIO_INVALID",
  "TRANSCRIPTION_ERROR",
  "SPEECH_UNAVAILABLE",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

// ---- Voice transcription boundary (Live only) ----

export const TranscriptionSuccessSchema = z.strictObject({
  ok: z.literal(true),
  providerMode: z.literal("live"), // server-authoritative provenance
  candidateOnly: z.literal(true), // cannot mutate mastery until explicit submit
  transcript: z.string().min(1), // editable candidate, never auto-submitted
  media: ServerAudioMetadataSchema,
});
export type TranscriptionSuccess = z.infer<typeof TranscriptionSuccessSchema>;

export const TranscriptionFailureSchema = z.strictObject({
  ok: z.literal(false),
  providerMode: z.literal("live"),
  code: z.enum(["AUDIO_INVALID", "TRANSCRIPTION_ERROR"]),
  message: z.string().min(1), // safe, stable, no raw provider details
});
export type TranscriptionFailure = z.infer<typeof TranscriptionFailureSchema>;

export const TranscriptionEnvelopeSchema = z.discriminatedUnion("ok", [
  TranscriptionSuccessSchema,
  TranscriptionFailureSchema,
]);
export type TranscriptionEnvelope = z.infer<typeof TranscriptionEnvelopeSchema>;

// ---- Request ----

export const TurnRequestSchema = z.strictObject({
  topicId: z.string().min(1), // must match the one curated topic
  nodeIds: z
    .array(z.string().min(1))
    .min(6)
    .max(8) // the 6-8 node ids of the topic
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "nodeIds must be unique",
    }),
  explanation: z.string().min(1).max(4000),
  priorStates: z.record(z.string(), MasteryStateSchema), // current map, client-owned
  turnIndex: z.number().int().nonnegative(), // 0-based
  outputMode: z.enum(["text", "text_and_audio"]), // presentation preference, not evidence
});
export type TurnRequest = z.infer<typeof TurnRequestSchema>;

// ---- Response (also the OpenAI Structured Outputs schema) ----

export const MasteryAssessmentSchema = z.strictObject({
  nodeId: z.string().min(1), // must be one of TurnRequest.nodeIds
  state: MasteryStateSchema,
  // verbatim substring of explanation; null ONLY for unassessed/insufficient_evidence
  evidenceQuote: z.string().min(1).nullable(),
  rationale: z.string().max(240), // formative language
});
export type MasteryAssessment = z.infer<typeof MasteryAssessmentSchema>;

export const MisconceptionSchema = z.strictObject({
  nodeId: z.string().min(1),
  evidenceQuote: z.string().min(1), // verbatim substring, REQUIRED
  gentleNote: z.string().max(240), // "worth double-checking..." phrasing
});
export type Misconception = z.infer<typeof MisconceptionSchema>;

export const TurnResultSchema = z.strictObject({
  assessments: z.array(MasteryAssessmentSchema),
  misconceptions: z.array(MisconceptionSchema), // may be empty
  probe: z.strictObject({
    question: z.string().min(1).max(500), // one Curious Follow-up
    targetsNodeId: z.string().min(1),
  }),
});
export type TurnResult = z.infer<typeof TurnResultSchema>;

// ---- Transport envelope (blueprint §6.1 rule 7) ----

export const ProbeAudioSchema = z.strictObject({
  mediaType: z.literal("audio/mpeg"),
  dataBase64: z.string().min(1), // exact probe.question rendering only
  disclosure: z.literal("AI-generated voice"),
});
export type ProbeAudio = z.infer<typeof ProbeAudioSchema>;

const envelopeBase = z.strictObject({ result: TurnResultSchema });

export const TurnEnvelopeSchema = z.discriminatedUnion("audioStatus", [
  envelopeBase.extend({
    providerMode: ProviderModeSchema,
    audioStatus: z.literal("not_requested"),
    probeAudio: z.null(),
  }),
  envelopeBase.extend({
    providerMode: ProviderModeSchema,
    audioStatus: z.literal("unavailable"),
    probeAudio: z.null(),
  }),
  envelopeBase.extend({
    providerMode: z.literal("live"), // ready is Live-only
    audioStatus: z.literal("ready"),
    probeAudio: ProbeAudioSchema,
  }),
  envelopeBase.extend({
    providerMode: z.literal("replay"), // simulated is Replay-only
    audioStatus: z.literal("simulated"),
    probeAudio: ProbeAudioSchema,
  }),
]);
export type TurnEnvelope = z.infer<typeof TurnEnvelopeSchema>;

// ---- Session summary ----

export const FORMATIVE_DISCLAIMER =
  "SishyaGuru mastery states are formative learning guidance, not a grade, credential, or diagnosis." as const;

export const SummaryResultSchema = z.strictObject({
  strengths: z.array(
    z.strictObject({
      nodeId: z.string().min(1),
      evidenceQuote: z.string().min(1), // every claimed strength quotes the learner
      note: z.string().min(1),
    }),
  ),
  gaps: z.array(
    z.strictObject({
      nodeId: z.string().min(1),
      note: z.string().min(1), // gaps need not quote (absence of evidence)
    }),
  ),
  suggestedNextExplanation: z.string().min(1),
  disclaimer: z.literal(FORMATIVE_DISCLAIMER), // fixed formative-not-a-grade disclaimer
});
export type SummaryResult = z.infer<typeof SummaryResultSchema>;
