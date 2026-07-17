import { describe, it, expect } from "vitest";
import { validateTurnRequest, applyTurn, validateTurnResult } from "../../lib/mastery";
import { WATER_CYCLE_NODE_IDS, initialMasteryStates, WATER_CYCLE_TOPIC } from "../../lib/topic";
import type { TurnRequest, TurnResult } from "../../lib/contract";

describe("domain / mastery", () => {
  const validRequest: TurnRequest = {
    topicId: WATER_CYCLE_TOPIC.id,
    nodeIds: [...WATER_CYCLE_NODE_IDS],
    explanation: "This is a valid explanation that mentions evaporation and condensation.",
    priorStates: initialMasteryStates(),
    turnIndex: 0,
    outputMode: "text",
  };

  it("validates exact nodes", () => {
    // Valid
    expect(validateTurnRequest(validRequest).ok).toBe(true);

    // Missing node
    const missingNodeReq: TurnRequest = {
      ...validRequest,
      nodeIds: validRequest.nodeIds.slice(1),
    };
    // Zod schema length must be 6-8 but length check in mastery.ts fails on exact size
    expect(validateTurnRequest(missingNodeReq).ok).toBe(false);

    // Unknown node ID
    const unknownNodeReq: TurnRequest = {
      ...validRequest,
      nodeIds: [
        ...validRequest.nodeIds.slice(0, 7),
        "unknown-node",
      ],
    };
    expect(validateTurnRequest(unknownNodeReq).ok).toBe(false);

    // Malformed prior state keys
    const badPriorReq = { ...validRequest, priorStates: { ...validRequest.priorStates } };
    delete badPriorReq.priorStates["evaporation"];
    expect(validateTurnRequest(badPriorReq).ok).toBe(false);
  });

  it("rejects duplicate IDs in request", () => {
    const dupNodeReq: TurnRequest = {
      ...validRequest,
      nodeIds: [
        ...WATER_CYCLE_NODE_IDS.slice(0, 7),
        WATER_CYCLE_NODE_IDS[0],
      ] as string[],
    };
    // Handled by Zod schema `.refine` for unique elements
    expect(validateTurnRequest(dupNodeReq).ok).toBe(false);
  });

  const validResult: TurnResult = {
    assessments: [
      {
        nodeId: "evaporation",
        state: "secure",
        evidenceQuote: "mentions evaporation",
        rationale: "good",
      },
    ],
    misconceptions: [],
    probe: { question: "probe", targetsNodeId: "condensation" },
  };

  it("enforces exact substring matching and valid quote rules", () => {
    expect(validateTurnResult(validRequest, validResult).ok).toBe(true);

    // Fabricated quote
    const fabricated = {
      ...validResult,
      assessments: [
        {
          nodeId: "evaporation",
          state: "secure",
          evidenceQuote: "this quote is not in the text",
          rationale: "good",
        } as const,
      ],
    };
    expect(validateTurnResult(validRequest, fabricated).ok).toBe(false);

    const unknownAssessment = {
      ...validResult,
      assessments: [{ ...validResult.assessments[0], nodeId: "unknown-node" }],
    };
    expect(validateTurnResult(validRequest, unknownAssessment).ok).toBe(false);

    // Empty quote when judged
    const emptyQuote = {
      ...validResult,
      assessments: [
        {
          nodeId: "evaporation",
          state: "secure",
          evidenceQuote: null,
          rationale: "good",
        } as const,
      ],
    };
    expect(validateTurnResult(validRequest, emptyQuote).ok).toBe(false);

    // Quote present when not judged
    const quoteUnassessed = {
      ...validResult,
      assessments: [
        {
          nodeId: "evaporation",
          state: "unassessed",
          evidenceQuote: "mentions evaporation",
          rationale: "good",
        } as const,
      ],
    };
    expect(validateTurnResult(validRequest, quoteUnassessed).ok).toBe(false);

    const fabricatedMisconception = {
      ...validResult,
      misconceptions: [{
        nodeId: "evaporation",
        evidenceQuote: "not in the explanation",
        gentleNote: "Worth double-checking this idea.",
      }],
    };
    expect(validateTurnResult(validRequest, fabricatedMisconception).ok).toBe(false);

    const harshMisconception = {
      ...validResult,
      misconceptions: [{
        nodeId: "evaporation",
        evidenceQuote: "mentions evaporation",
        gentleNote: "This is wrong.",
      }],
    };
    expect(validateTurnResult(validRequest, harshMisconception).ok).toBe(false);
  });

  it("enforces unique assessment node judgments", () => {
    const duplicateAssessment = {
      ...validResult,
      assessments: [
        validResult.assessments[0],
        validResult.assessments[0],
      ],
    };
    expect(validateTurnResult(validRequest, duplicateAssessment).ok).toBe(false);
  });

  it("enforces valid probe target", () => {
    const invalidTarget = {
      ...validResult,
      probe: { question: "probe", targetsNodeId: "unknown-node" },
    };
    expect(validateTurnResult(validRequest, invalidTarget).ok).toBe(false);
  });

  it("applies turn atomically, not mutating on failure", () => {
    const application = applyTurn(validRequest, validResult);
    expect(application.ok).toBe(true);
    if (application.ok) {
      expect(application.states["evaporation"]).toBe("secure");
      // Does not mutate priorStates
      expect(validRequest.priorStates["evaporation"]).toBe("unassessed");
    }

    const invalidResult = {
      ...validResult,
      probe: { question: "probe", targetsNodeId: "unknown-node" }, // invalid
    };
    const failApp = applyTurn(validRequest, invalidResult);
    expect(failApp.ok).toBe(false);
    if (!failApp.ok) {
      // Returned exact prior map
      expect(failApp.states).toBe(validRequest.priorStates);
      expect(failApp.states["evaporation"]).toBe("unassessed");
    }
  });
});
