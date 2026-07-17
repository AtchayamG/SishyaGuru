import {
  JUDGED_STATES,
  SummaryResultSchema,
  TurnRequestSchema,
  TurnResultSchema,
  type MasteryState,
  type SummaryResult,
  type TurnRequest,
  type TurnResult,
} from "./contract";
import { WATER_CYCLE_NODE_IDS, WATER_CYCLE_TOPIC } from "./topic";

/**
 * Evidence validator and mastery reducer (blueprint §6.1, ADR-002).
 * Any single rule failure rejects the complete result; nothing is clamped,
 * downgraded, or partially applied.
 */

export type RequestValidation =
  | { ok: true; request: TurnRequest }
  | { ok: false; code: "INVALID_INPUT"; reason: string };

/** Validates an untrusted turn request against the contract and curated topic. */
export function validateTurnRequest(candidate: unknown): RequestValidation {
  const parsed = TurnRequestSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_INPUT", reason: parsed.error.issues[0]?.message ?? "malformed request" };
  }
  const request = parsed.data;
  if (request.topicId !== WATER_CYCLE_TOPIC.id) {
    return { ok: false, code: "INVALID_INPUT", reason: `unknown topicId "${request.topicId}"` };
  }
  const curated = new Set(WATER_CYCLE_NODE_IDS);
  const badNode = request.nodeIds.find((id) => !curated.has(id));
  if (badNode !== undefined) {
    return { ok: false, code: "INVALID_INPUT", reason: `unknown nodeId "${badNode}"` };
  }
  if (request.nodeIds.length !== curated.size) {
    return { ok: false, code: "INVALID_INPUT", reason: "nodeIds must exactly match the canonical topic nodes" };
  }

  const priorKeys = Object.keys(request.priorStates);
  const badPrior = priorKeys.find((id) => !curated.has(id));
  if (badPrior !== undefined) {
    return { ok: false, code: "INVALID_INPUT", reason: `unknown priorStates nodeId "${badPrior}"` };
  }
  if (priorKeys.length !== curated.size) {
    return { ok: false, code: "INVALID_INPUT", reason: "priorStates must exactly match the canonical topic nodes" };
  }
  return { ok: true, request };
}

export type ResultValidation =
  | { ok: true; result: TurnResult }
  | { ok: false; code: "SCHEMA_INVALID"; reason: string };

const judged: readonly MasteryState[] = JUDGED_STATES;

/**
 * Validates an untrusted provider result against the request (§6.1 rules 2–5).
 * Every judged assessment and every misconception must cite a non-empty exact
 * verbatim substring of the submitted explanation.
 */
export function validateTurnResult(
  request: TurnRequest,
  candidate: unknown,
): ResultValidation {
  const reject = (reason: string): ResultValidation => ({
    ok: false,
    code: "SCHEMA_INVALID",
    reason,
  });

  const parsed = TurnResultSchema.safeParse(candidate);
  if (!parsed.success) {
    return reject(parsed.error.issues[0]?.message ?? "malformed result");
  }
  const result = parsed.data;
  const known = new Set(request.nodeIds);

  const seen = new Set<string>();
  for (const assessment of result.assessments) {
    if (!known.has(assessment.nodeId)) {
      return reject(`unknown assessment nodeId "${assessment.nodeId}"`);
    }
    if (seen.has(assessment.nodeId)) {
      return reject(`duplicate assessment for nodeId "${assessment.nodeId}"`);
    }
    seen.add(assessment.nodeId);
    if (judged.includes(assessment.state)) {
      if (assessment.evidenceQuote === null) {
        return reject(`state "${assessment.state}" requires an evidence quote`);
      }
      if (!request.explanation.includes(assessment.evidenceQuote)) {
        return reject("evidenceQuote is not a verbatim substring of the explanation");
      }
    } else if (assessment.evidenceQuote !== null) {
      return reject(`state "${assessment.state}" must not carry an evidence quote`);
    }
  }

  for (const misconception of result.misconceptions) {
    if (!known.has(misconception.nodeId)) {
      return reject(`unknown misconception nodeId "${misconception.nodeId}"`);
    }
    if (!request.explanation.includes(misconception.evidenceQuote)) {
      return reject("misconception evidenceQuote is not a verbatim substring of the explanation");
    }
    if (!misconception.gentleNote.toLowerCase().includes("worth double-checking")) {
      return reject('misconception gentleNote must use "worth double-checking" framing');
    }
  }

  if (!known.has(result.probe.targetsNodeId)) {
    return reject(`unknown probe target "${result.probe.targetsNodeId}"`);
  }

  return { ok: true, result };
}

export type SummaryValidation =
  | { ok: true; result: SummaryResult }
  | { ok: false; code: "SCHEMA_INVALID"; reason: string };

/** Validates summary claims against canonical nodes and accumulated learner text. */
export function validateSummaryResult(
  candidate: unknown,
  evidenceCorpus: readonly string[],
): SummaryValidation {
  const parsed = SummaryResultSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      code: "SCHEMA_INVALID",
      reason: parsed.error.issues[0]?.message ?? "malformed summary",
    };
  }

  const known = new Set(WATER_CYCLE_NODE_IDS);
  const seenStrengths = new Set<string>();
  for (const strength of parsed.data.strengths) {
    if (!known.has(strength.nodeId) || seenStrengths.has(strength.nodeId)) {
      return {
        ok: false,
        code: "SCHEMA_INVALID",
        reason: `unknown or duplicate strength nodeId "${strength.nodeId}"`,
      };
    }
    if (!evidenceCorpus.some((explanation) => explanation.includes(strength.evidenceQuote))) {
      return {
        ok: false,
        code: "SCHEMA_INVALID",
        reason: "strength evidenceQuote is not a verbatim substring of session evidence",
      };
    }
    seenStrengths.add(strength.nodeId);
  }

  const seenGaps = new Set<string>();
  for (const gap of parsed.data.gaps) {
    if (
      !known.has(gap.nodeId) ||
      seenGaps.has(gap.nodeId) ||
      seenStrengths.has(gap.nodeId)
    ) {
      return {
        ok: false,
        code: "SCHEMA_INVALID",
        reason: `unknown, duplicate, or conflicting gap nodeId "${gap.nodeId}"`,
      };
    }
    seenGaps.add(gap.nodeId);
  }

  return { ok: true, result: parsed.data };
}

export type TurnApplication =
  | { ok: true; states: Record<string, MasteryState>; result: TurnResult }
  | {
      ok: false;
      code: "SCHEMA_INVALID";
      reason: string;
      states: Record<string, MasteryState>; // exact prior map, untouched
    };

/**
 * Applies a provider result atomically: a fully validated turn produces a new
 * state map; any validation failure returns the prior map unchanged (same
 * reference, never mutated).
 */
export function applyTurn(request: TurnRequest, candidate: unknown): TurnApplication {
  const validation = validateTurnResult(request, candidate);
  if (!validation.ok) {
    return { ...validation, states: request.priorStates };
  }
  const states: Record<string, MasteryState> = { ...request.priorStates };
  for (const assessment of validation.result.assessments) {
    states[assessment.nodeId] = assessment.state;
  }
  return { ok: true, states, result: validation.result };
}
