# Threat Model and Privacy Contract

## Scope

SishyaGuru accepts learner-authored typed text or an explicitly recorded bounded audio
turn and returns formative, evidence-backed mastery guidance. P0 has no accounts,
database, general file upload, email integration, payments or social features.

## Trust boundaries

```mermaid
flowchart LR
  L["Learner browser"] -->|"confirmed text + session state"| R["Session routes"]
  L -->|"optional bounded audio"| A["Audio validation + transcription route"]
  R --> V["schema and policy validation"]
  V --> P{"provider"}
  P -->|"live, server only"| O["OpenAI Responses API"]
  P -->|"replay"| F["versioned local fixtures"]
  A -->|"live, server only"| O
  O -->|"transcript only"| A
  A -->|"editable transcript"| L
  O --> V
  F --> V
  V -->|"validated assessment"| L
```

The browser is untrusted. Model output is untrusted until it passes the same schema and policy validation as replay data.

## Protected assets

- `OPENAI_API_KEY` and provider configuration.
- Learner explanations and session history.
- Ephemeral microphone audio, unsubmitted transcript candidates and generated probe speech.
- Explicitly submitted reviewed explanations retained as browser-local session progress.
- Curriculum rubric and concept identifiers.
- Provider provenance and live/replay truthfulness.
- Integrity of mastery evidence and state labels.

## Threats and controls

| Threat | P0 control | Verification |
|---|---|---|
| API key reaches browser bundle | Read key only in server-only module; never expose `NEXT_PUBLIC_*` secret | Build scan and bundle search |
| Prompt injection in learner text | Delimit learner content; system policy and rubric are not user-controlled; validate output | Injection evaluation fixture |
| Model invents evidence | Evidence quote must be an exact substring of the learner explanation | Deterministic validator test |
| Unsupported mastery certainty | State is bounded; `insufficient_evidence` is allowed; UI labels judgments as formative estimates | Contract and UI tests |
| Replay presented as live | Provider provenance is mandatory and visible near results | Browser assertion |
| Cross-site scripting | Render text as text; no raw HTML or Markdown execution from learner/model content | XSS fixture |
| Oversized or abusive input | Trim and enforce character/turn limits before provider call | Boundary tests |
| Malicious or oversized audio | Explicit activation; exact `audio/webm`/`audio/mp4` allowlist; container-signature verification; server-derived duration; ≤60 seconds/≤5 MB; request/rate limits; timeout; never trust client metadata | Route boundary and forged-metadata tests |
| Accidental capture or submission | Push-to-talk only; visible timer; cancel; mandatory transcript review/edit; never auto-submit | Browser tests |
| Audio/transcript retention | Memory-only raw audio and unsubmitted candidate; release after transcription/cancel; submitted reviewed text becomes disclosed browser-local progress until Clear; no disk/DB/server-log content | Storage, clear-flow and log assertions |
| Voice impersonation confusion | Built-in voice only; persistent “AI-generated voice” disclosure; identical visible text | UI assertion |
| Speech/biometric overreach | No speaker identity, emotion, accent, fluency or health inference | Code/prompt review and negative tests |
| Arbitrary TTS abuse | No public text-to-speech route; turn handler renders only validated probe text | Contract test |
| Sensitive learner data retained | No server database; avoid request body logging; browser clear-session control | Code review and E2E clear flow |
| Model provides full answer too early | Response contract requires one focused question and bounded hint; policy validator rejects answer dumps | Evaluation grader |
| Harmful or shaming feedback | Respectful tone policy, neutral retry copy, no mental-health or ability diagnosis | Content fixtures and review |
| Cost or denial-of-wallet | Three-turn server contract, streamed input limits and instance-local demo throttling; public judge deployment remains Replay-only until authenticated durable distributed limits exist | Route tests and deployment configuration check |
| Provider outage or malformed result | Fail closed with recoverable error; do not manufacture mastery updates | Contract tests |

## Data-minimization policy

- Collect no name, email, age, school, location or account identifier in P0.
- Tell learners not to include personal or sensitive information.
- Keep progress in browser storage only and provide a clear reset control.
- Send only the minimum current explanation, curated concept rubric and bounded prior context required for assessment.
- If voice is chosen, send only the current bounded recording for transcription. Do not
  persist raw audio or an unsubmitted candidate. After explicit review and submission,
  retain the resulting explanation only as disclosed browser-local progress until Clear.
- Generate speech only from the validated AI probe. Do not speak evidence quotes,
  misconceptions, personal data, or arbitrary client-supplied text.
- Configure OpenAI requests with storage disabled when supported by the selected API contract.
- Do not write raw learner explanations to server logs or analytics.

## Educational safety

- SishyaGuru provides formative guidance, not grades, credentials, diagnoses or admissions decisions.
- Mastery means “demonstrated in this conversation against this rubric,” not permanent knowledge.
- A learner can retry, inspect supporting evidence and clear the session.
- The product must distinguish a misconception from insufficient evidence.
- The AI must not shame, rank intelligence, or imply that uncertainty is failure.

## Security exit criteria

- Secret scan passes.
- Browser bundle contains no server secret.
- Injection, XSS, evidence-forgery and oversized-input fixtures fail safely.
- Audio type/size/duration, permission, cancellation, transcript-review and arbitrary-TTS
  boundary tests pass; raw audio and unsubmitted candidates are absent from storage and
  logs, while submitted reviewed text is cleared by the browser-local reset flow.
- Replay/live provenance is visible and tested.
- No server-side persistence of learner content exists in P0.
- Public deployment uses Replay mode and contains no OpenAI key; Live remains an
  owner-authorized local proof until authenticated distributed abuse controls exist.
