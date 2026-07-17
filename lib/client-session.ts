import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  MasteryAssessmentSchema,
  MasteryStateSchema,
  MisconceptionSchema,
  SummaryResultSchema,
  type TurnRequest,
} from "./contract";
import {
  REPLAY_TURN_FIXTURES,
  getReplaySummaryFixture,
  getReplayTurnFixture,
} from "./replay";
import {
  applyTurn,
  validateSummaryResult,
  validateTurnRequest,
} from "./mastery";
import {
  WATER_CYCLE_NODE_IDS,
  WATER_CYCLE_TOPIC,
  initialMasteryStates,
} from "./topic";

const ChatMessageSchema = z.strictObject({
  id: z.string().min(1),
  role: z.enum(["ai", "user"]),
  text: z.string().min(1).max(4000),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const MasteryMapSchema = z
  .record(z.string(), MasteryStateSchema)
  .superRefine((states, context) => {
    const actual = Object.keys(states).sort();
    const expected = [...WATER_CYCLE_NODE_IDS].sort();
    if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
      context.addIssue({
        code: "custom",
        message: "masteryStates must contain exactly the canonical topic nodes",
      });
    }
  });

export const ClientSessionStateSchema = z.strictObject({
  version: z.literal(1),
  topicId: z.literal(WATER_CYCLE_TOPIC.id),
  turnIndex: z.number().int().min(0).max(REPLAY_TURN_FIXTURES.length),
  masteryStates: MasteryMapSchema,
  messages: z.array(ChatMessageSchema).min(1).max(1 + REPLAY_TURN_FIXTURES.length * 2),
  misconceptions: z.array(MisconceptionSchema),
  lastAssessments: z.array(MasteryAssessmentSchema),
  summary: SummaryResultSchema.nullable(),
  error: z.string().max(500).nullable(),
});

export type ClientSessionState = z.infer<typeof ClientSessionStateSchema>;

export const SESSION_STORAGE_KEY = "sishyaguru_progress_v1";

function getInitialState(): ClientSessionState {
  return {
    version: 1,
    topicId: WATER_CYCLE_TOPIC.id,
    turnIndex: 0,
    masteryStates: initialMasteryStates(),
    messages: [
      {
        id: "start",
        role: "ai",
        text: "I'm trying to understand The Water Cycle. Can you teach me solar energy?",
      },
    ],
    misconceptions: [],
    lastAssessments: [],
    summary: null,
    error: null,
  };
}

function readStoredState(): ClientSessionState {
  const saved = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!saved) return getInitialState();

  try {
    const parsed = ClientSessionStateSchema.safeParse(JSON.parse(saved));
    if (parsed.success) return parsed.data;
  } catch {
    // Invalid learner-controlled browser data is discarded without logging content.
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
  return getInitialState();
}

function isPristine(state: ClientSessionState): boolean {
  return (
    state.turnIndex === 0 &&
    state.messages.length === 1 &&
    state.lastAssessments.length === 0 &&
    state.misconceptions.length === 0 &&
    state.summary === null &&
    state.error === null
  );
}

export function useClientSession() {
  const [state, setState] = useState<ClientSessionState>(getInitialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setState(readStoredState());
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isPristine(state)) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setState(getInitialState());
  }, []);

  const submitTurn = useCallback(
    (explanation: string): boolean => {
      const fixture = getReplayTurnFixture(state.topicId, state.turnIndex);
      if (!fixture) {
        setState((previous) => ({
          ...previous,
          error: "Simulated Replay error: no more sample turns are available.",
        }));
        return false;
      }

      const requestCandidate: TurnRequest = {
        topicId: state.topicId,
        nodeIds: [...WATER_CYCLE_NODE_IDS],
        explanation,
        priorStates: state.masteryStates,
        turnIndex: state.turnIndex,
        outputMode: "text",
      };
      const request = validateTurnRequest(requestCandidate);
      if (!request.ok) {
        setState((previous) => ({ ...previous, error: request.reason }));
        return false;
      }

      const application = applyTurn(request.request, fixture.result);
      if (!application.ok) {
        setState((previous) => ({
          ...previous,
          error:
            "Simulated Replay guidance: this fixed demo can assess only the provided sample evidence. Your text was preserved; load the sample or revise it to include the cited wording.",
        }));
        return false;
      }

      const turnIndex = state.turnIndex;
      setState((previous) => ({
        ...previous,
        error: null,
        turnIndex: turnIndex + 1,
        masteryStates: application.states,
        messages: [
          ...previous.messages,
          { id: `user-${turnIndex}`, role: "user", text: explanation },
          { id: `ai-${turnIndex}`, role: "ai", text: application.result.probe.question },
        ],
        lastAssessments: application.result.assessments,
        misconceptions: application.result.misconceptions,
      }));
      return true;
    },
    [state],
  );

  const requestSummary = useCallback((): boolean => {
    if (getReplayTurnFixture(state.topicId, state.turnIndex)) return false;
    const fixture = getReplaySummaryFixture(state.topicId);
    if (!fixture) return false;

    const evidenceCorpus = state.messages
      .filter((message) => message.role === "user")
      .map((message) => message.text);
    const validation = validateSummaryResult(fixture.result, evidenceCorpus);
    if (!validation.ok) {
      setState((previous) => ({
        ...previous,
        error: "Simulated Replay error: the session summary could not be grounded.",
      }));
      return false;
    }

    setState((previous) => ({
      ...previous,
      summary: validation.result,
      error: null,
    }));
    return true;
  }, [state]);

  return {
    state,
    isLoaded,
    clearSession,
    submitTurn,
    requestSummary,
    currentFixture: getReplayTurnFixture(state.topicId, state.turnIndex),
  };
}
