import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  MasteryAssessmentSchema,
  MasteryStateSchema,
  MisconceptionSchema,
  ProviderModeSchema,
  SummaryApiEnvelopeSchema,
  SummaryResultSchema,
  TurnApiEnvelopeSchema,
  type ProbeAudio,
  type TurnRequest,
} from "./contract";
import type { ProviderMode } from "./env";
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
  version: z.literal(2),
  providerMode: ProviderModeSchema,
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

export const SESSION_STORAGE_KEY = "sishyaguru_progress_v2";

function getInitialState(providerMode: ProviderMode): ClientSessionState {
  return {
    version: 2,
    providerMode,
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

function readStoredState(providerMode: ProviderMode): ClientSessionState {
  const saved = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!saved) return getInitialState(providerMode);

  try {
    const parsed = ClientSessionStateSchema.safeParse(JSON.parse(saved));
    if (parsed.success && parsed.data.providerMode === providerMode) return parsed.data;
  } catch {
    // Invalid learner-controlled browser data is discarded without logging content.
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
  return getInitialState(providerMode);
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

export function useClientSession(providerMode: ProviderMode) {
  const [state, setState] = useState<ClientSessionState>(() => getInitialState(providerMode));
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [probeAudio, setProbeAudio] = useState<ProbeAudio | null>(null);
  const operationRef = useRef<{
    controller: AbortController | null;
    generation: number;
    running: boolean;
  }>({ controller: null, generation: 0, running: false });

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setState(readStoredState(providerMode));
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [providerMode]);

  useEffect(() => () => {
    operationRef.current.generation += 1;
    operationRef.current.controller?.abort();
    operationRef.current.running = false;
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
    operationRef.current.generation += 1;
    operationRef.current.controller?.abort();
    operationRef.current.controller = null;
    operationRef.current.running = false;
    setIsBusy(false);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setState(getInitialState(providerMode));
    setProbeAudio(null);
  }, [providerMode]);

  const beginOperation = useCallback(() => {
    if (operationRef.current.running) return undefined;
    const controller = new AbortController();
    operationRef.current.running = true;
    operationRef.current.controller = controller;
    operationRef.current.generation += 1;
    setIsBusy(true);
    return { controller, generation: operationRef.current.generation };
  }, []);

  const isCurrentOperation = useCallback(
    (generation: number) => operationRef.current.generation === generation,
    [],
  );

  const finishOperation = useCallback((generation: number) => {
    if (!isCurrentOperation(generation)) return;
    operationRef.current.running = false;
    operationRef.current.controller = null;
    setIsBusy(false);
  }, [isCurrentOperation]);

  const submitTurn = useCallback(
    async (explanation: string): Promise<boolean> => {
      const operation = beginOperation();
      if (!operation) return false;
      const requestCandidate: TurnRequest = {
        topicId: state.topicId,
        nodeIds: [...WATER_CYCLE_NODE_IDS],
        explanation,
        priorStates: state.masteryStates,
        turnIndex: state.turnIndex,
        outputMode: providerMode === "live" ? "text_and_audio" : "text",
      };
      const request = validateTurnRequest(requestCandidate);
      if (!request.ok) {
        setState((previous) => ({ ...previous, error: request.reason }));
        finishOperation(operation.generation);
        return false;
      }

      try {
        let candidateResult: unknown;
        let candidateAudio: ProbeAudio | null = null;
        if (providerMode === "replay") {
          const fixture = getReplayTurnFixture(state.topicId, state.turnIndex);
          if (!fixture) {
            if (isCurrentOperation(operation.generation)) {
              setState((previous) => ({
                ...previous,
                error: "Simulated Replay error: no more sample turns are available.",
              }));
            }
            return false;
          }
          candidateResult = fixture.result;
        } else {
          const response = await fetch("/api/session/turn", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(request.request),
            signal: operation.controller.signal,
          });
          if (!isCurrentOperation(operation.generation)) return false;
          const envelope = TurnApiEnvelopeSchema.safeParse(await response.json());
          if (!isCurrentOperation(operation.generation)) return false;
          if (!envelope.success) {
            setState((previous) => ({
              ...previous,
              error: "The Live assessment returned an unreadable response.",
            }));
            return false;
          }
          if (!envelope.data.ok) {
            const message = envelope.data.message;
            setState((previous) => ({ ...previous, error: message }));
            return false;
          }
          if (envelope.data.envelope.providerMode !== "live") {
            setState((previous) => ({
              ...previous,
              error: "The Live assessment provenance did not match the configured provider.",
            }));
            return false;
          }
          candidateResult = envelope.data.envelope.result;
          candidateAudio = envelope.data.envelope.probeAudio;
        }
        if (!isCurrentOperation(operation.generation)) return false;
        const application = applyTurn(request.request, candidateResult);
        if (!application.ok) {
          setState((previous) => ({
            ...previous,
            error:
              providerMode === "replay"
                ? "Simulated Replay guidance: this fixed demo can assess only the provided sample evidence. Your text was preserved; load the sample or revise it to include the cited wording."
                : "The Live assessment failed the evidence gate. Your explanation was preserved.",
          }));
          return false;
        }

        const turnIndex = state.turnIndex;
        setProbeAudio(candidateAudio);
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
      } catch (error) {
        if (isCurrentOperation(operation.generation) && !(error instanceof DOMException && error.name === "AbortError")) {
          setState((previous) => ({
            ...previous,
            error: "The Live assessment could not be reached. Your explanation was preserved.",
          }));
        }
        return false;
      } finally {
        finishOperation(operation.generation);
      }
    },
    [beginOperation, finishOperation, isCurrentOperation, providerMode, state],
  );

  const requestSummary = useCallback(async (): Promise<boolean> => {
    if (getReplayTurnFixture(state.topicId, state.turnIndex)) return false;
    const operation = beginOperation();
    if (!operation) return false;
    const evidenceCorpus = state.messages
      .filter((message) => message.role === "user")
      .map((message) => message.text);
    try {
      let candidateSummary: unknown;
      if (providerMode === "replay") {
        candidateSummary = getReplaySummaryFixture(state.topicId)?.result;
      } else {
        const response = await fetch("/api/session/summary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topicId: state.topicId,
            evidenceCorpus,
            masteryStates: state.masteryStates,
          }),
          signal: operation.controller.signal,
        });
        if (!isCurrentOperation(operation.generation)) return false;
        const envelope = SummaryApiEnvelopeSchema.safeParse(await response.json());
        if (!isCurrentOperation(operation.generation)) return false;
        if (!envelope.success) {
          setState((previous) => ({
            ...previous,
            error: "The Live summary returned an unreadable response.",
          }));
          return false;
        }
        if (!envelope.data.ok) {
          const message = envelope.data.message;
          setState((previous) => ({ ...previous, error: message }));
          return false;
        }
        candidateSummary = envelope.data.result;
      }
      if (!isCurrentOperation(operation.generation)) return false;
      const validation = validateSummaryResult(candidateSummary, evidenceCorpus);
      if (!validation.ok) {
        setState((previous) => ({
          ...previous,
          error: "The session summary could not be grounded in your explanations.",
        }));
        return false;
      }

      setState((previous) => ({
        ...previous,
        summary: validation.result,
        error: null,
      }));
      return true;
    } catch (error) {
      if (isCurrentOperation(operation.generation) && !(error instanceof DOMException && error.name === "AbortError")) {
        setState((previous) => ({ ...previous, error: "The session summary could not be reached." }));
      }
      return false;
    } finally {
      finishOperation(operation.generation);
    }
  }, [beginOperation, finishOperation, isCurrentOperation, providerMode, state]);

  return {
    state,
    isLoaded,
    isBusy,
    probeAudio,
    clearSession,
    submitTurn,
    requestSummary,
    currentFixture: getReplayTurnFixture(state.topicId, state.turnIndex),
  };
}
