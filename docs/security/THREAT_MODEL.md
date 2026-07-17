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
- Ephemeral microphone audio, transcripts and generated probe speech.
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
| Audio/transcript retention | Memory-only audio; release blob after transcription/cancel; no disk/DB/localStorage/log content | Storage and log assertions |
| Voice impersonation confusion | Built-in voice only; persistent “AI-generated voice” disclosure; identical visible text | UI assertion |
| Speech/biometric overreach | No speaker identity, emotion, accent, fluency or health inference | Code/prompt review and negative tests |
| Arbitrary TTS abuse | No public text-to-speech route; turn handler renders only validated probe text | Contract test |
| Sensitive learner data retained | No server database; avoid request body logging; browser clear-session control | Code review and E2E clear flow |
| Model provides full answer too early | Response contract requires one focused question and bounded hint; policy validator rejects answer dumps | Evaluation grader |
| Harmful or shaming feedback | Respectful tone policy, neutral retry copy, no mental-health or ability diagnosis | Content fixtures and review |
| Cost or denial-of-wallet | Per-session turn budget, input/output limits and visible retry behavior | Route tests and manual check |
| Provider outage or malformed result | Fail closed with recoverable error; do not manufacture mastery updates | Contract tests |

## Data-minimization policy

- Collect no name, email, age, school, location or account identifier in P0.
- Tell learners not to include personal or sensitive information.
- Keep progress in browser storage only and provide a clear reset control.
- Send only the minimum current explanation, curated concept rubric and bounded prior context required for assessment.
- If voice is chosen, send only the current bounded recording for transcription. Do not
  persist it, use it for mastery, or retain it in browser progress.
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
  boundary tests pass; audio/transcript content is absent from storage and logs.
- Replay/live provenance is visible and tested.
- No server-side persistence of learner content exists in P0.
