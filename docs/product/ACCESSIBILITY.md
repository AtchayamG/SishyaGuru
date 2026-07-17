# Accessibility Specification (WCAG 2.2 AA)

## 1. Keyboard Behavior
- All interactive elements (buttons, links, form fields, tabs) must be accessible via the `Tab` key.
- The logical tab order must follow the visual flow of the document (Left to Right, Top to Bottom).
- Complex components like the Concept Map must support arrow-key navigation between nodes.
- Users must be able to submit their chat messages via `Enter` (and `Shift+Enter` for newlines).

## 2. Focus Management
- A highly visible focus ring (minimum 2px solid border with high contrast against the background) must enclose focused elements.
- When dynamic content loads (e.g., a new AI message or a Mastery Panel update), focus should not be unexpectedly stolen from the user's input field.
- If a modal or off-canvas drawer is opened (e.g., mobile concept map), focus must be trapped within it until closed, and returned to the triggering element upon closure.

## 3. Reduced Motion
- The application must respect the user's OS-level `prefers-reduced-motion` settings.
- When enabled, CSS transitions, typing indicators, and concept map node animations must gracefully degrade to instant state changes.

## 4. Color and Contrast
- **Text Contrast:** All regular text must have a minimum contrast ratio of 4.5:1 against its background. Large text (18pt+) must have a 3:1 ratio.
- **Non-Text Contrast:** UI components (buttons, input borders, Concept Map nodes) and graphical objects (Mastery meters) must have a contrast ratio of at least 3:1 against adjacent colors.
- **Color Independence:** Information must not be conveyed by color alone. (e.g., A "misconception" state must use an icon or text label in addition to an amber color).

## 5. Acceptance Criteria (WCAG 2.2 AA)
- **AC1:** Automated accessibility scans (e.g., Axe) return zero WCAG 2.2 AA violations on all screen states (default, loading, error, empty).
- **AC2:** The entire teaching loop can be completed using only a keyboard without getting trapped.
- **AC3:** Screen readers correctly announce dynamic updates in the Chat and Mastery panels using appropriate `aria-live` regions (`polite` for mastery updates, `assertive` for errors).
- **AC4:** Zooming the page to 200% on desktop does not result in loss of content or functionality, and does not require horizontal scrolling (content reflows to single column).
- **AC5:** Minimum target size for all interactive elements is at least 24x24 CSS pixels.
- **AC6:** Push-to-talk, stop/cancel, transcript review, submit, play/pause/replay, mute,
  speed and stop are keyboard-operable with visible focus and programmatic names.
- **AC7:** Recording/transcribing/review/playing states are announced concisely; timers
  and limit warnings are available as text and never depend on animation, waveform, or color.
- **AC8:** Every spoken probe has identical visible text. Text-only use completes the
  golden path when microphone permission, recording, transcription or playback is unavailable.
- **AC9:** The interface visibly and programmatically discloses AI-generated speech and
  respects `prefers-reduced-motion` for recording/playback indicators.
