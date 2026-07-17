# SishyaGuru

> You teach. AI learns. You master.

SishyaGuru is a reverse-teaching mastery coach where students teach an AI learner by
typing or speaking, answer its curious written or spoken questions, and watch their
understanding grow through a live concept mastery map.

## Status

Pre-production architecture, product, UX, safety, testing, evaluation, and submission planning are complete. Implementation has not started, and no working product or live GPT-5.6 result is claimed yet.

## Documentation

- Product source of truth: `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md`
- Product requirements: `docs/product/PRD.md`
- Architecture: `docs/architecture/SYSTEM_ARCHITECTURE.md`
- Voice architecture: `docs/architecture/VOICE_ARCHITECTURE.md`
- UX specification: `docs/product/UX_SPECIFICATION.md`
- Voice UX specification: `docs/product/VOICE_UX_SPECIFICATION.md`
- Threat model: `docs/security/THREAT_MODEL.md`
- Test strategy: `docs/testing/TEST_STRATEGY.md`
- Evaluation plan: `docs/evaluation/EVALUATION_PLAN.md`
- Implementation plan: `docs/project/IMPLEMENTATION_PLAN.md`
- Project status: `docs/project/taskstatus.md`
- Hackathon evidence: `docs/hackathon/rules-and-evidence-matrix.md`

## Intended P0

A single Next.js application will host the learner experience and server-only OpenAI
adapters. The learner may type or record a bounded push-to-talk lesson, review/edit the
transcript, and explicitly submit it through the same evidence-bound GPT-5.6 contract.
The AI's exact follow-up remains visible as text and may play as disclosed AI-generated
speech. A clearly labelled deterministic Replay mode supports credential-free judging
without calling OpenAI audio APIs.

## License

MIT
