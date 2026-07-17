import { describe, it, expect } from "vitest";
import {
  TurnResultSchema,
  TurnEnvelopeSchema,
  SummaryResultSchema,
  TranscriptionEnvelopeSchema,
  FORMATIVE_DISCLAIMER,
} from "../../lib/contract";
import { evaluateAudioPolicy, MAX_AUDIO_BYTES, MAX_AUDIO_DURATION_MS } from "../../lib/audio-policy";

describe("domain / contract", () => {
  it("rejects 0 length probe and 501 length probe", () => {
    const validResult = {
      assessments: [],
      misconceptions: [],
      probe: {
        question: "a",
        targetsNodeId: "evaporation",
      },
    };

    expect(TurnResultSchema.safeParse(validResult).success).toBe(true);

    const emptyProbe = {
      ...validResult,
      probe: { ...validResult.probe, question: "" },
    };
    expect(TurnResultSchema.safeParse(emptyProbe).success).toBe(false);

    const longProbe = {
      ...validResult,
      probe: { ...validResult.probe, question: "a".repeat(501) },
    };
    expect(TurnResultSchema.safeParse(longProbe).success).toBe(false);

    const maxProbe = {
      ...validResult,
      probe: { ...validResult.probe, question: "a".repeat(500) },
    };
    expect(TurnResultSchema.safeParse(maxProbe).success).toBe(true);
  });

  it("enforces fixed summary disclaimer", () => {
    const validSummary = {
      strengths: [],
      gaps: [],
      suggestedNextExplanation: "next",
      disclaimer: FORMATIVE_DISCLAIMER,
    };
    expect(SummaryResultSchema.safeParse(validSummary).success).toBe(true);

    const invalidSummary = {
      ...validSummary,
      disclaimer: "Something else",
    };
    expect(SummaryResultSchema.safeParse(invalidSummary).success).toBe(false);
  });

  it("enforces exact audio allowlist and caps with server-derived duration", () => {
    // Valid WebM
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/webm",
        byteLength: 1000,
        durationMs: 1000,
        durationSource: "server-derived",
      }).ok
    ).toBe(true);

    // Valid MP4
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/mp4",
        byteLength: 1000,
        durationMs: 1000,
        durationSource: "server-derived",
      }).ok
    ).toBe(true);

    // Invalid MIME
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/wav",
        byteLength: 1000,
        durationMs: 1000,
        durationSource: "server-derived",
      }).ok
    ).toBe(false);

    // Missing server-derived provenance
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/webm",
        byteLength: 1000,
        durationMs: 1000,
      }).ok
    ).toBe(false);

    // Forged provenance
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/webm",
        byteLength: 1000,
        durationMs: 1000,
        durationSource: "client-provided",
      }).ok
    ).toBe(false);

    expect(
      evaluateAudioPolicy({
        mediaType: "audio/webm",
        byteLength: MAX_AUDIO_BYTES,
        durationMs: MAX_AUDIO_DURATION_MS,
        durationSource: "server-derived",
      }).ok
    ).toBe(true);

    // Zero/oversize bounds
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/webm",
        byteLength: 0,
        durationMs: 1000,
        durationSource: "server-derived",
      }).ok
    ).toBe(false);
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/webm",
        byteLength: MAX_AUDIO_BYTES + 1,
        durationMs: 1000,
        durationSource: "server-derived",
      }).ok
    ).toBe(false);

    // Oversize duration
    expect(
      evaluateAudioPolicy({
        mediaType: "audio/webm",
        byteLength: 1000,
        durationMs: MAX_AUDIO_DURATION_MS + 1,
        durationSource: "server-derived",
      }).ok
    ).toBe(false);
  });

  it("enforces transcript candidate-only/provenance", () => {
    const validSuccess = {
      ok: true,
      providerMode: "live",
      candidateOnly: true,
      transcript: "hello",
      media: {
        mediaType: "audio/webm",
        byteLength: 1000,
        durationMs: 1000,
        durationSource: "server-derived",
      },
    };
    expect(TranscriptionEnvelopeSchema.safeParse(validSuccess).success).toBe(true);
    expect(
      TranscriptionEnvelopeSchema.safeParse({ ...validSuccess, unexpected: true }).success
    ).toBe(false);

    // Not candidate only
    expect(
      TranscriptionEnvelopeSchema.safeParse({
        ...validSuccess,
        candidateOnly: false,
      }).success
    ).toBe(false);

    // Not live provider
    expect(
      TranscriptionEnvelopeSchema.safeParse({
        ...validSuccess,
        providerMode: "replay",
      }).success
    ).toBe(false);
  });

  it("rejects impossible provider/status/audio combinations in TurnEnvelope", () => {
    const validResult = {
      assessments: [],
      misconceptions: [],
      probe: { question: "a", targetsNodeId: "evaporation" },
    };

    // Valid: Live / ready / probeAudio present
    expect(
      TurnEnvelopeSchema.safeParse({
        result: validResult,
        providerMode: "live",
        audioStatus: "ready",
        probeAudio: {
          mediaType: "audio/mpeg",
          dataBase64: "base64",
          disclosure: "AI-generated voice",
        },
      }).success
    ).toBe(true);

    // Invalid: Live / simulated (simulated is replay only)
    expect(
      TurnEnvelopeSchema.safeParse({
        result: validResult,
        providerMode: "live",
        audioStatus: "simulated",
        probeAudio: {
          mediaType: "audio/mpeg",
          dataBase64: "base64",
          disclosure: "AI-generated voice",
        },
      }).success
    ).toBe(false);

    // Invalid: Replay / ready (ready is live only)
    expect(
      TurnEnvelopeSchema.safeParse({
        result: validResult,
        providerMode: "replay",
        audioStatus: "ready",
        probeAudio: {
          mediaType: "audio/mpeg",
          dataBase64: "base64",
          disclosure: "AI-generated voice",
        },
      }).success
    ).toBe(false);

    // Valid: not_requested / probeAudio null
    expect(
      TurnEnvelopeSchema.safeParse({
        result: validResult,
        providerMode: "live",
        audioStatus: "not_requested",
        probeAudio: null,
      }).success
    ).toBe(true);

    // Invalid: not_requested / probeAudio present
    expect(
      TurnEnvelopeSchema.safeParse({
        result: validResult,
        providerMode: "live",
        audioStatus: "not_requested",
        probeAudio: {
          mediaType: "audio/mpeg",
          dataBase64: "base64",
          disclosure: "AI-generated voice",
        },
      }).success
    ).toBe(false);

    expect(
      TurnEnvelopeSchema.safeParse({
        result: validResult,
        providerMode: "replay",
        audioStatus: "simulated",
        probeAudio: {
          mediaType: "audio/mpeg",
          dataBase64: "simulated-fixture",
          disclosure: "AI-generated voice",
        },
      }).success
    ).toBe(true);

    expect(
      TurnEnvelopeSchema.safeParse({
        result: validResult,
        providerMode: "replay",
        audioStatus: "simulated",
        probeAudio: null,
      }).success
    ).toBe(false);
  });
});
