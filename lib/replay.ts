import { FORMATIVE_DISCLAIMER, type SummaryResult, type TurnResult } from "./contract";
import { WATER_CYCLE_TOPIC } from "./topic";

/**
 * Deterministic Replay fixtures (ADR-003). Everything in this module is
 * SIMULATED, hand-authored data for credential-free demos and tests. It is
 * never a live GPT-5.6 result and must never be presented as one.
 */

export const REPLAY_PROVENANCE = "simulated" as const;

export interface ReplayTurnFixture {
  provenance: typeof REPLAY_PROVENANCE;
  topicId: string;
  turnIndex: number;
  /** Simulated learner explanation offered as the sample transcript; every evidence quote cites it. */
  explanation: string;
  result: TurnResult;
}

export interface ReplaySummaryFixture {
  provenance: typeof REPLAY_PROVENANCE;
  topicId: string;
  result: SummaryResult;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const TURN_FIXTURES: readonly ReplayTurnFixture[] = deepFreeze([
  // Turn 0 — strong explanation: secure evaporation and condensation.
  {
    provenance: REPLAY_PROVENANCE,
    topicId: WATER_CYCLE_TOPIC.id,
    turnIndex: 0,
    explanation:
      "The sun heats water in oceans and lakes, so liquid water turns into invisible water vapour and rises into the air. Higher up the vapour cools down and condenses into tiny liquid droplets that gather together as clouds.",
    result: {
      assessments: [
        {
          nodeId: "solar-energy",
          state: "developing",
          evidenceQuote: "The sun heats water in oceans and lakes",
          rationale:
            "You named the sun as the heat source; saying it powers the whole cycle would make this secure.",
        },
        {
          nodeId: "evaporation",
          state: "secure",
          evidenceQuote:
            "liquid water turns into invisible water vapour and rises into the air",
          rationale: "Clear cause, state change, and direction in your own words.",
        },
        {
          nodeId: "condensation",
          state: "secure",
          evidenceQuote:
            "the vapour cools down and condenses into tiny liquid droplets that gather together as clouds",
          rationale: "Cooling, state change, and cloud formation all explained.",
        },
      ],
      misconceptions: [],
      probe: {
        question:
          "That makes sense! Once the droplets in a cloud grow bigger and heavier, what makes them come back down to the ground?",
        targetsNodeId: "precipitation",
      },
    },
  },
  // Turn 1 — developing explanation with one misconception.
  {
    provenance: REPLAY_PROVENANCE,
    topicId: WATER_CYCLE_TOPIC.id,
    turnIndex: 1,
    explanation:
      "When the droplets get heavy enough they fall out of the cloud as rain or snow, which is called precipitation. I think the rain water that soaks into the ground just disappears and is gone from the cycle after that.",
    result: {
      assessments: [
        {
          nodeId: "precipitation",
          state: "developing",
          evidenceQuote:
            "When the droplets get heavy enough they fall out of the cloud as rain or snow",
          rationale:
            "You linked heavy droplets to falling rain; what makes them grow heavy is still fuzzy.",
        },
        {
          nodeId: "infiltration-and-groundwater",
          state: "emerging",
          evidenceQuote: "the rain water that soaks into the ground",
          rationale:
            "You noticed water soaking in; what happens to it underground is not clear yet.",
        },
      ],
      misconceptions: [
        {
          nodeId: "infiltration-and-groundwater",
          evidenceQuote: "just disappears and is gone from the cycle",
          gentleNote:
            "Worth double-checking: does soaked-in water really leave the cycle, or does it become groundwater that keeps moving?",
        },
      ],
      probe: {
        question:
          "Interesting! When rain lands on a hillside and does not soak in, where do you think that water goes next?",
        targetsNodeId: "collection-and-surface-runoff",
      },
    },
  },
  // Turn 2 — under-specified explanation: insufficient evidence, honestly stated.
  {
    provenance: REPLAY_PROVENANCE,
    topicId: WATER_CYCLE_TOPIC.id,
    turnIndex: 2,
    explanation: "Plants also do something with water, and runoff is a thing too.",
    result: {
      assessments: [
        {
          nodeId: "transpiration",
          state: "insufficient_evidence",
          evidenceQuote: null,
          rationale:
            "You mentioned plants and water, but not what plants do with it, so I cannot tell yet.",
        },
        {
          nodeId: "collection-and-surface-runoff",
          state: "insufficient_evidence",
          evidenceQuote: null,
          rationale:
            "You named runoff without describing where the water flows or gathers.",
        },
      ],
      misconceptions: [],
      probe: {
        question:
          "You said plants do something with water — what do you think happens inside a leaf on a hot sunny day?",
        targetsNodeId: "transpiration",
      },
    },
  },
]);

const SUMMARY_FIXTURE: ReplaySummaryFixture = deepFreeze({
  provenance: REPLAY_PROVENANCE,
  topicId: WATER_CYCLE_TOPIC.id,
  result: {
    strengths: [
      {
        nodeId: "evaporation",
        evidenceQuote:
          "liquid water turns into invisible water vapour and rises into the air",
        note: "You explained evaporation with cause and state change in your own words.",
      },
      {
        nodeId: "condensation",
        evidenceQuote:
          "the vapour cools down and condenses into tiny liquid droplets that gather together as clouds",
        note: "You connected cooling to droplet and cloud formation clearly.",
      },
    ],
    gaps: [
      {
        nodeId: "transpiration",
        note: "We have not heard yet what plants do with water.",
      },
      {
        nodeId: "infiltration-and-groundwater",
        note: "Worth revisiting where soaked-in water goes instead of disappearing.",
      },
      {
        nodeId: "cyclic-movement-of-water",
        note: "The loop that returns water to evaporation has not been explained yet.",
      },
    ],
    suggestedNextExplanation:
      "Try teaching how water that soaks into the ground and water that runs off both return to the ocean, closing the cycle.",
    disclaimer: FORMATIVE_DISCLAIMER,
  },
});

/**
 * Tiny non-personal placeholder standing in for simulated probe audio. It is a
 * versioned descriptor, not real or learner audio, and is always disclosed.
 */
export const REPLAY_PROBE_AUDIO = deepFreeze({
  provenance: REPLAY_PROVENANCE,
  mediaType: "audio/mpeg",
  // base64 of "SishyaGuru simulated replay probe audio placeholder v1 - not real audio"
  dataBase64:
    "U2lzaHlhR3VydSBzaW11bGF0ZWQgcmVwbGF5IHByb2JlIGF1ZGlvIHBsYWNlaG9sZGVyIHYxIC0gbm90IHJlYWwgYXVkaW8=",
  disclosure: "AI-generated voice",
} as const);

/** Deterministic lookup keyed by (topicId, turnIndex). */
export function getReplayTurnFixture(
  topicId: string,
  turnIndex: number,
): ReplayTurnFixture | undefined {
  if (topicId !== WATER_CYCLE_TOPIC.id) return undefined;
  return TURN_FIXTURES.find((fixture) => fixture.turnIndex === turnIndex);
}

export function getReplaySummaryFixture(
  topicId: string,
): ReplaySummaryFixture | undefined {
  return topicId === WATER_CYCLE_TOPIC.id ? SUMMARY_FIXTURE : undefined;
}

export const REPLAY_TURN_FIXTURES = TURN_FIXTURES;
