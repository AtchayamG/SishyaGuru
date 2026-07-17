# UX Specification: SishyaGuru

## 1. Design Principles (Ponytail Discipline)
- **Focused & Professional:** A clean, data-dense experience. No generic neon/gradient AI dashboard elements.
- **Evidence-Based:** UI elements communicate state clearly without assuming user intent.
- **Responsive Coherence:** The three-panel desktop layout gracefully adapts to smaller screens.

## 2. Information Architecture
- **Root (`/`)**: Main Learning Interface (P0 - Single Curated Topic)
- **State Layer**: Browser-local progress tracking.

## 3. Screen Inventory
### Main Learning Interface (P0)
A single page encompassing the three core pillars of the experience. Voice is an
optional control set inside the teaching panel, not a separate experience:
1. **Concept Map Panel (Left):** Visual representation of the curated topic's knowledge graph.
2. **Teaching Conversation Panel (Center):** Chat interface where the student teaches the AI.
3. **Mastery Feedback Panel (Right):** Dynamic, evidence-backed evaluation of the student's mastery.

## 4. Responsive Breakpoints
- **Desktop (>= 1024px):** Three-panel layout (Concept Map 25%, Conversation 50%, Feedback 25%).
- **Tablet (768px - 1023px):** Two-panel layout (Conversation 60%, Feedback 40%). Concept Map accessible via off-canvas menu/drawer.
- **Mobile (< 768px):** Single-column layout. Tabbed navigation between Concept Map, Conversation, and Mastery Feedback. Default view is Conversation.

## 5. Component Inventory
- **Layout:** ThreePanelContainer, ResponsiveTabGroup.
- **Concept Map:** GraphNode, EdgeConnector, TopicLegend.
- **Conversation:** ChatLog, UserMessageBubble, AIMessageBubble, ChatInputForm,
  PushToTalkButton, RecordingTimer, TranscriptReview, ProbeAudioPlayer, TypingIndicator.
- **Mastery Feedback:** SupportLevelBadge, EvidenceCard, MisconceptionAlert, RetryPrompt.
- **Global:** HeaderBar, ProvenanceBadge ("Live GPT-5.6" or "Simulated Replay"), PrivacyNotice, ClearSessionButton.

## 6. Interaction States
- **Default:** Topic loaded, AI awaits the student's initial typed or voice-derived teaching statement.
- **Hover/Focus:** Interactive elements (buttons, nodes) highlight with accessible contrast shifts.
- **Loading:** Skeleton loaders in the Mastery Feedback panel during AI evaluation; smooth typing indicator in the Conversation panel.
- **Disabled:** Send button disabled when input is empty or AI is generating a response.
- **Voice:** Request permission only on activation; show recording timer and limit warning;
  stop/cancel explicitly; show an editable transcript; never auto-submit. Spoken probes
  retain identical visible text and play/pause/replay/mute/stop controls.
- **Voice failure:** Permission denial, unsupported browser, transcription failure, or
  speech failure preserves the complete text path and prior mastery state.
- **Error:** Non-intrusive inline errors that explain whether the learner can retry. The application never silently changes from live mode to replay mode.
- **Empty States:** Concept map shows unlit nodes; Mastery Feedback displays "Awaiting your first lesson to assess mastery."

## 7. Acceptance Criteria (Responsive & Layout)
- **AC1:** Desktop view must simultaneously display the concept map, conversation, and mastery feedback without horizontal scrolling.
- **AC2:** Mobile view must default to the conversation and provide accessible tab navigation to the concept map and mastery panels.
- **AC3:** UI components must not use decorative gradients or neon colors, adhering strictly to a professional palette.
- **AC4:** All loading states must provide clear visual feedback within 300ms of user action.
- **AC5:** Every screen state (empty, loading, active, error) must be visually distinct and coherent across all breakpoints.
- **AC6:** Every voice state is keyboard-operable and announced without stealing focus;
  microphone access is optional, transcript review is mandatory, and AI speech is disclosed.
