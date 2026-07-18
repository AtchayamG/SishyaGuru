# Video Production Plan

## Output contract

- Public YouTube video, English, 1920×1080, 30 fps, H.264/AAC.
- Runtime below three minutes; target 2:20–2:35.
- Clear premium TTS narration, normalized speech, no copyrighted music required.
- Corrected English SRT uploaded to YouTube; captions are not burned into the app UI.
- Authentic product footage; every Replay/Live label in narration matches the screen.

## Shot plan

| Time | Visual |
|---|---|
| 0:00–0:15 | Minimal branded title animation: student explanation flows into a concept map. |
| 0:15–0:32 | Production Replay deployment, full three-panel desktop composition. |
| 0:32–0:58 | Verified local Live capture: Record, timer, Stop, editable candidate, explicit submit, disclosed native audio control. |
| 0:58–1:28 | Replay golden path turns; zoom/crop follows evidence, probe and map changes. |
| 1:28–1:48 | Misconception evidence and grounded final summary. |
| 1:48–2:15 | Sanitized architecture card and test/proof metadata; never show a key, prompt or transcript content. |
| 2:15–2:30 | Test gate montage and branded closing frame with repository/deployment URLs. |

## Production workflow

1. Capture production Replay at 1920×1080 with no development indicator.
2. Capture the owner-authorized local Live voice path separately and label it Live.
3. Generate narration from `VIDEO_SCRIPT.md` using the best installed premium English voice.
4. Assemble with FFmpeg: restrained title/section cards, product footage, narration and
   short crossfades. Avoid decorative generated footage that obscures product evidence.
5. Generate and proofread SRT timing from the final narration.
6. Verify with `ffprobe`: runtime, resolution, codecs, audio stream and file integrity.
7. Watch the final MP4 end to end, confirm labels/copy, then upload Public to YouTube.

## Optional generated animation policy

Google Flow or Higgsfield may create only a short abstract opening transition if the local
motion-card result is inadequate. Do not generate fake product UI, fake learners, technical
proof, or any scene that could be mistaken for working functionality.
