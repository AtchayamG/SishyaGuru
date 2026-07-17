import OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";
import { initialMasteryStates } from "../../lib/topic";
import { getReplaySummaryFixture, getReplayTurnFixture } from "../../lib/replay";
import { createLiveSummary, createLiveTurn } from "../../lib/server/live-provider";
import { inspectAudio, transcribeLiveAudio } from "../../lib/server/audio-provider";

const WEBM_FIXTURE = Buffer.from(
  [
    "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAJ0EU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZU",
    "rmtTrIHYTbuMU6uEElTDZ1OsggFCTbuMU6uEHFO7a1OsggJe7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1M",
    "YXZmNjIuMTIuMTAxV0GNTGF2ZjYyLjEyLjEwMUSJiEBqAAAAAAAAFlSua+WuAQAAAAAAAFzXgQFzxYjG3JLr9CqRnZyBACK1nIN1",
    "bmSIgQCGhkFfT1BVU1aqg2MuoFa7hATEtACDgQLhkZ+BAbWIQL9AAAAAAABiZIEQY6KTT3B1c0hlYWQBATgBQB8AAAAAABJUw2f9",
    "c3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2Mi4xMi4xMDFzc9djwItjxYjG3JLr9CqRnWfIokWjh0VOQ09ERVJEh5VMYXZjNjIu",
    "MjguMTAxIGxpYm9wdXNnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAwLjIwODAwMDAwMAAfQ7Z1QJTngQCji4EAAIAIC+S5oLyEo4qB",
    "ABWACAfGsw7Go4qBACmACAfGsw7Go4qBAD2ACAfGsw7Go4qBAFGACAfGsw7Go4qBAGWACAfGsw7Go4qBAHmACAfGsw7Go4qBAI2A",
    "CAfGsw7Go4qBAKGACAfGsw7Go4qBALWACAfGsw7GoJahioEAyQAIB8azDsabgQd1ooQAzf5gHFO7a5G7j7OBALeK94EB8YIBxPCB",
    "Aw==",
  ].join(""),
  "base64",
);

function request(outputMode: "text" | "text_and_audio" = "text") {
  const fixture = getReplayTurnFixture("water-cycle", 0);
  if (!fixture) throw new Error("missing test fixture");
  return {
    topicId: "water-cycle",
    nodeIds: Object.keys(initialMasteryStates()),
    explanation: fixture.explanation,
    priorStates: initialMasteryStates(),
    turnIndex: 0,
    outputMode,
  };
}

function clientWithResult(result: unknown) {
  const parse = vi.fn().mockResolvedValue({ output_parsed: result });
  const speech = vi.fn().mockResolvedValue(
    new Response(Uint8Array.from([0x49, 0x44, 0x33, 0x04])),
  );
  const transcribe = vi.fn().mockResolvedValue({ text: "  reviewed candidate text  " });
  const client = {
    responses: { parse },
    audio: { speech: { create: speech }, transcriptions: { create: transcribe } },
  } as unknown as OpenAI;
  return { client, parse, speech, transcribe };
}

describe("Live provider boundaries", () => {
  it("uses stateless GPT-5.6 Structured Outputs and revalidates evidence", async () => {
    const fixture = getReplayTurnFixture("water-cycle", 0);
    const fake = clientWithResult(fixture?.result);
    const result = await createLiveTurn(request(), fake.client);

    expect(result.ok).toBe(true);
    expect(fake.parse).toHaveBeenCalledOnce();
    const body = fake.parse.mock.calls[0]?.[0];
    expect(body).toMatchObject({ model: "gpt-5.6", store: false });
    expect(JSON.stringify(body)).not.toContain(process.env.OPENAI_API_KEY);
    if (result.ok) expect(result.envelope.audioStatus).toBe("not_requested");
  });

  it("rejects an ungrounded model result before speech", async () => {
    const fixture = getReplayTurnFixture("water-cycle", 0);
    const invalid = structuredClone(fixture?.result);
    if (!invalid) throw new Error("missing test fixture");
    invalid.assessments[0]!.evidenceQuote = "words the learner never said";
    const fake = clientWithResult(invalid);

    const result = await createLiveTurn(request("text_and_audio"), fake.client);
    expect(result).toMatchObject({ ok: false, code: "SCHEMA_INVALID" });
    expect(fake.speech).not.toHaveBeenCalled();
  });

  it("renders only the exact validated probe and discloses AI speech", async () => {
    const fixture = getReplayTurnFixture("water-cycle", 0);
    const fake = clientWithResult(fixture?.result);
    const result = await createLiveTurn(request("text_and_audio"), fake.client);

    expect(result.ok).toBe(true);
    expect(fake.speech.mock.calls[0]?.[0]?.input).toBe(fixture?.result.probe.question);
    if (result.ok) {
      expect(result.envelope.audioStatus).toBe("ready");
      expect(result.envelope.probeAudio?.disclosure).toBe("AI-generated voice");
    }
  });

  it("keeps a valid text turn when optional speech fails", async () => {
    const fixture = getReplayTurnFixture("water-cycle", 0);
    const fake = clientWithResult(fixture?.result);
    fake.speech.mockRejectedValueOnce(new Error("raw provider detail"));
    const result = await createLiveTurn(request("text_and_audio"), fake.client);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.envelope.audioStatus).toBe("unavailable");
    expect(JSON.stringify(result)).not.toContain("raw provider detail");
  });

  it("derives WebM type and duration from the container", async () => {
    const metadata = await inspectAudio(WEBM_FIXTURE);
    expect(metadata).toMatchObject({
      mediaType: "audio/webm",
      byteLength: WEBM_FIXTURE.byteLength,
      durationSource: "server-derived",
    });
    expect(metadata?.durationMs).toBeGreaterThan(0);
    expect(await inspectAudio(Uint8Array.from([1, 2, 3, 4]))).toBeUndefined();
  });

  it("returns a candidate-only transcript without trusting the browser MIME", async () => {
    const fake = clientWithResult(undefined);
    const file = new File([WEBM_FIXTURE], "forged.mp4", { type: "audio/mp4" });
    const result = await transcribeLiveAudio(file, fake.client);

    expect(result).toMatchObject({
      ok: true,
      providerMode: "live",
      candidateOnly: true,
      transcript: "reviewed candidate text",
      media: { mediaType: "audio/webm", durationSource: "server-derived" },
    });
    expect(fake.transcribe).toHaveBeenCalledOnce();
  });

  it("accepts only a summary grounded in accumulated learner evidence", async () => {
    const fixture = getReplaySummaryFixture("water-cycle");
    const fake = clientWithResult(fixture?.result);
    const evidenceCorpus = [
      getReplayTurnFixture("water-cycle", 0)!.explanation,
      getReplayTurnFixture("water-cycle", 1)!.explanation,
      getReplayTurnFixture("water-cycle", 2)!.explanation,
    ];
    const result = await createLiveSummary(
      {
        topicId: "water-cycle",
        evidenceCorpus,
        masteryStates: initialMasteryStates(),
      },
      fake.client,
    );

    expect(result).toMatchObject({ ok: true, providerMode: "live" });
    expect(fake.parse.mock.calls[0]?.[0]).toMatchObject({ model: "gpt-5.6", store: false });
  });
});
