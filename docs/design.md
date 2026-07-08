# sg-helper-bot — design

_Date: 2026-07-08_

## Purpose

A Telegram bot that a Singapore migrant domestic worker sends any confusing
English thing to — a payslip, a contract, a message from her employer, an MOM
letter — and gets back a plain-language explanation **in her own language**, plus
a verified rights check when one applies. Free, cost-capped, worker-side only, no
surveillance surface.

## Why this shape

The market for a two-sided employer↔helper compliance app is already served (e.g.
HelperMate ships salary/6ME/permit/rest-day tracking, two-sided, free). The
un-built, defensible slice is **one-sided and helper-facing**: it needs no
employer, so it has no two-sided cold-start problem; the AI (document
explanation + translation + rights Q&A) is the core, not a garnish; and it can
spread worker-to-worker in chat groups without an NGO distribution gate. It
inverts the original "family assistant" idea by serving only the worker.

Known accepted risk: Telegram under-indexes vs WhatsApp for this population; the
bot link is forwardable and a WhatsApp/web channel is a v2 option.

## Architecture (auditable core + thin AI shell)

```
Telegram ──webhook──▶ Cloudflare Worker (TS/Bun)
                          │
        ┌─────────────────┼────────────────────┐
        ▼                 ▼                     ▼
  Rate limiter      Keyword router        Rule-card corpus
  (KV: uid→count,   (deterministic,       (verified MOM cards) ◀── TRUST SURFACE
   daily, TTL)       code, TDD'd)
                          │
                          ▼
                 Claude Haiku 4.5 (multimodal)
                 - explains/translates the SENT content
                 - faithfully translates the matched card
                 - NEVER asserts a rule from training
                          │
                          ▼
              Reply: explanation + card (translated) + source
                     link + "reminder, not legal advice" footer
```

## The trust invariant

The rule-card corpus (`src/corpus/cards.ts`) is the **only** place allowed to
assert what an MOM rule is. Card selection is deterministic keyword-matching code
(`src/corpus/router.ts`), not an AI call — so the model can never surface a rule
the corpus didn't hand it. The AI does two things only: explain/translate the
worker's own content, and restate the matched card faithfully. If nothing routes,
the bot points to the MOM/CDE helplines rather than guessing.

This mirrors the TrueYield pattern: a small, human-auditable, test-covered core
(there: the IRR engine; here: the corpus) wrapped in a thin presentation layer.

## Components

- **Worker entry** (`src/index.ts`) — verifies the Telegram secret header,
  acks immediately, processes via `waitUntil`.
- **Rate limiter / user state** (`src/user.ts`) — KV stores only a language
  preference and a TTL'd daily counter per Telegram id. No document/message
  content is ever persisted.
- **Router** (`src/corpus/router.ts`) — keyword → card(s), ranked, `[]` on no
  match.
- **Corpus** (`src/corpus/cards.ts`) — 7 verified cards: salary timing, salary
  records/bank access, deductions, rest days, 6ME, upkeep/medical, helplines.
- **AI presenter** (`src/ai.ts`) — the single model call; strict system prompt
  forbids authoring rules.
- **Reply** (`src/reply.ts`) — disclaimer footer, source link, stateless
  quick-reply buttons (My rights / Get help).

## Privacy & cost

- Zero document/message persistence; photos and text are processed in memory.
- Hard per-user daily cap (default 20) bounds AI spend; the helplines card is
  never rate-limited (safety).
- Cheap model (`claude-haiku-4-5`) + a small corpus keeps realistic cost at
  coffee-money scale. Funding posture: run free & capped like TrueYield; chase
  Cloudflare Project Galileo / LLM social-good credits only if it gets traction.

## Languages

v1 ships English + Tagalog + Bahasa Indonesia. Burmese is implemented but
**feature-flagged off** (`ENABLE_BURMESE=false`) until a native reader validates
the rule-card translations — a bad translation on the rights axis causes the harm
the tool exists to prevent.

## Explicitly deferred (YAGNI)

Personal reminders (own 6ME/permit dates), any employer-facing tooling,
cross-subsidy revenue, WhatsApp/web channels, conflict mediation, open-ended
chat. All v1.1+.

## Testing

The corpus and router are the trust surface and are unit-tested
(`test/corpus.test.ts`, `test/router.test.ts`): schema/integrity, official-source
citations, unique ids, and routing fixtures standing in for real questions.
`test/reply.test.ts` covers the disclaimer, source link, and button wiring. The
AI presenter is isolated behind a boundary so tests never call the live API.
