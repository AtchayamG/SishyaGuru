# Voice UX Specification: SishyaGuru
**Status:** Planned / Pre-production (Not Implemented)

## 1. Core Principles & Privacy
- **Additive, Not Replacive:** Voice features (push-to-talk teaching and spoken AI follow-ups) are completely optional and do not replace the existing text interface. The text-only flow must always be able to complete the full golden path.
- **Strict Privacy & Transparency:** 
  - Do not imply continuous conversation or background listening.
  - No emotion detection, biometric analysis, or recording storage is performed.
  - Do not claim perfect transcription; always allow text editing.
  - Explicitly disclose that the AI voice is generated.
- **Professional Aesthetics:** Keep the UI minimal and academic. Avoid decorative waveforms unless they explicitly and accessibly communicate recording levels or status.
- **Simulated Replay Constraint:** Replay mode must be clearly simulated and must not invoke OpenAI audio APIs.

## 2. Voice Turn States
The voice interaction follows a strict state machine to prevent accidental submissions:
1. **Idle:** The default state, awaiting user action.
2. **Requesting Microphone Permission:** Triggered on first use. Includes explicit education on why the microphone is needed and how it will be used.
3. **Recording with Timer:** User is actively speaking. A visible timer is displayed. Includes a duration warning as the time limit approaches.
4. **Processing Transcription:** Converting the user's speech to text.
5. **Transcript Review/Edit:** The transcribed text is placed in the input field. **Crucial:** Never auto-submit a transcript. The learner must have the opportunity to review, edit, and explicitly submit it.
6. **Ready to Submit:** Transcript has been reviewed and is ready for the learner's explicit submission.
7. **Assessing:** The system is evaluating the submission (mirrors the text loading state).
8. **Speaking Probe:** The AI is actively speaking its follow-up question/response. The complete AI probe is always simultaneously shown as text.
9. **Paused:** The AI's spoken audio is paused by the user.
10. **Recoverable Error:** Handles edge cases such as microphone permission denied, unsupported browser, or transcription failure.

## 3. Audio Controls & Semantics
- **Playback Controls:** The AI's spoken response must include accessible controls: Play/Pause/Replay, Mute, Speed (e.g., 1x, 1.25x), and Stop.
- **Recording Semantics:** Provide clear actions to cancel the current recording or delete/clear the transcript before submission.
- **Permission Denied/Unsupported Paths:** If the microphone is denied or unsupported, gracefully fall back to the text-only interface with a clear, non-intrusive explanation.

## 4. Accessibility (WCAG 2.2 AA)
- **Keyboard Operation & Focus:** All audio controls and recording buttons must be fully operable via the keyboard with a highly visible focus ring (minimum 2px solid border with high contrast).
- **Screen-Reader Announcements:** Use appropriate `aria-live` regions to announce state changes (e.g., "Recording started", "Transcription ready for review", "Microphone access denied").
- **Reduced Motion:** Respect `prefers-reduced-motion`. Any active recording indicators or functional waveforms must degrade to instant state changes or static indicators.
- **Color Independence:** Do not rely on color alone to indicate recording state or errors. Use clear text labels or iconography (e.g., a "Recording" text badge next to an icon).
