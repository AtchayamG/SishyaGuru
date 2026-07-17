import { describe, it, expect } from "vitest";
import {
  getReplayTurnFixture,
  getReplaySummaryFixture,
  REPLAY_PROVENANCE,
  REPLAY_TURN_FIXTURES,
} from "../../lib/replay";
import { WATER_CYCLE_NODE_IDS, WATER_CYCLE_TOPIC, initialMasteryStates } from "../../lib/topic";
import { validateSummaryResult, validateTurnResult } from "../../lib/mastery";

describe("domain / replay", () => {
  it("verifies Replay determinism with 5 fresh lookups", () => {
    const run1 = getReplayTurnFixture(WATER_CYCLE_TOPIC.id, 0);
    const run2 = getReplayTurnFixture(WATER_CYCLE_TOPIC.id, 0);
    const run3 = getReplayTurnFixture(WATER_CYCLE_TOPIC.id, 0);
    const run4 = getReplayTurnFixture(WATER_CYCLE_TOPIC.id, 0);
    const run5 = getReplayTurnFixture(WATER_CYCLE_TOPIC.id, 0);

    expect(run1).toBeDefined();
    expect(run1).toStrictEqual(run2);
    expect(run1).toStrictEqual(run3);
    expect(run1).toStrictEqual(run4);
    expect(run1).toStrictEqual(run5);

    // Check provenance
    expect(run1!.provenance).toBe(REPLAY_PROVENANCE);
  });

  it("validates all replay turn fixtures against the contract schemas", () => {
    const indices = [0, 1, 2];
    for (const idx of indices) {
      const fixture = getReplayTurnFixture(WATER_CYCLE_TOPIC.id, idx);
      expect(fixture).toBeDefined();
      expect(validateTurnResult({
        topicId: WATER_CYCLE_TOPIC.id,
        nodeIds: [...WATER_CYCLE_NODE_IDS],
        explanation: fixture!.explanation,
        priorStates: initialMasteryStates(),
        turnIndex: fixture!.turnIndex,
        outputMode: "text",
      }, fixture!.result).ok).toBe(true);
    }
  });

  it("validates summary fixture against the contract", () => {
    const summary = getReplaySummaryFixture(WATER_CYCLE_TOPIC.id);
    expect(summary).toBeDefined();
    expect(summary!.provenance).toBe(REPLAY_PROVENANCE);
    expect(validateSummaryResult(
      summary!.result,
      REPLAY_TURN_FIXTURES.map((fixture) => fixture.explanation),
    ).ok).toBe(true);
  });

  it("rejects ungrounded or unknown summary claims", () => {
    const summary = getReplaySummaryFixture(WATER_CYCLE_TOPIC.id)!;
    expect(validateSummaryResult({
      ...summary.result,
      strengths: [{
        nodeId: "evaporation",
        evidenceQuote: "fabricated session quote",
        note: "Unsupported strength",
      }],
    }, REPLAY_TURN_FIXTURES.map((fixture) => fixture.explanation)).ok).toBe(false);

    expect(validateSummaryResult({
      ...summary.result,
      gaps: [{ nodeId: "unknown-node", note: "Unknown gap" }],
    }, REPLAY_TURN_FIXTURES.map((fixture) => fixture.explanation)).ok).toBe(false);
  });

  it("returns undefined for unknown topic", () => {
    expect(getReplayTurnFixture("unknown-topic", 0)).toBeUndefined();
    expect(getReplaySummaryFixture("unknown-topic")).toBeUndefined();
  });
});
