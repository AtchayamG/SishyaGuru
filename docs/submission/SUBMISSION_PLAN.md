# Submission Plan

## Positioning

- Category: Education
- Name: SishyaGuru
- Tagline: You teach. AI learns. You master.
- Core story: most AI tutors explain answers to learners; SishyaGuru reverses the
  interaction so learners can speak or type a lesson, inspect the transcript/evidence,
  and repair knowledge gaps by teaching an AI learner that asks back in voice or text.

## Required artifacts

- Working replay-mode application, bounded live GPT-5.6 proof, and one synthetic live
  voice proof using OpenAI transcription and TTS.
- Public MIT repository created specifically for SishyaGuru.
- README with quickstart, fixture path, live configuration, architecture, Codex collaboration, GPT-5.6 role and limitations.
- Public YouTube video under three minutes with audio.
- English captions, automatic or corrected.
- Human-reviewed Devpost description.
- Education category selection.
- New primary SishyaGuru Codex `/feedback` session ID.
- Judge instructions that require no credential for the golden path.

## Target video structure

| Time | Scene |
|---|---|
| 0:00-0:15 | Problem: passive confidence is not demonstrated understanding |
| 0:15-0:30 | Brand and reverse-teaching premise |
| 0:30-1:10 | Learner speaks; reviews transcript; AI asks aloud and in text; map changes with cited evidence |
| 1:10-1:40 | Misconception and respectful retry |
| 1:40-2:00 | Session summary and remaining gaps |
| 2:00-2:20 | GPT-5.6, transcription/TTS and provenance proof |
| 2:20-2:30 | Codex build contribution, truthful limitations and close |

## Description outline

1. Inspiration: passive study creates false confidence.
2. What it does: teach the AI by voice or text, answer questions, inspect evidence-backed mastery.
3. How it works: Next.js, transcript review gate, GPT-5.6 Structured Outputs,
   `gpt-4o-mini-transcribe`, `gpt-4o-mini-tts`, and replay provider.
4. Challenges: grounding mastery in exact learner evidence without overclaiming certainty.
5. Accomplishments: only verified metrics from final gates.
6. What we learned: formative AI needs explainable evidence and uncertainty.
7. What is next: additional teacher-authored curricula only after the core loop is proven.
8. Truthful disclosure: distinguish replay footage, live smoke proof and not-yet-built features.

## Final submission gate

Do not submit until all are true:

- clean install and golden path pass;
- public repository and license open logged out;
- live GPT-5.6 receipt passes;
- bounded voice receipt passes; disclosure and captions/text equivalence are visible;
- video is public, playable, under three minutes and accurately narrated;
- description matches the current repository and footage;
- new Codex session ID is entered;
- eligibility and official-rule declarations are explicitly confirmed by the user for this second entry;
- Devpost reports 5/5 and Submitted.
