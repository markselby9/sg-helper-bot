# Contributing

The most valuable contributions are **corrections and additions to the rule
corpus** — it's the part real workers rely on. Please read this before changing
it.

## The trust boundary

There is exactly one place allowed to state what an MOM rule is:
`src/corpus/cards.ts`. Everything else — the router, the AI — only *routes to* or
*translates* a card. The AI is never permitted to author a rule from its own
knowledge (its system prompt forbids it, and card selection is deterministic code,
not a model call). So the corpus is the single thing that must be correct.

Treat an edit to a card like an edit to a financial calculation: it must be
sourced, exact, and tested.

## Adding or changing a rule card

Each card in `RULE_CARDS` is:

```ts
{
  id: "salary-timing",              // stable kebab-case; never reuse/repurpose
  title: "When your salary must be paid",
  keywords: ["salary", "not paid", ...],  // lowercase; route questions here
  ruleEn: "Your employer must pay ...",   // states ONLY what the source states
  sourceUrl: "https://www.mom.gov.sg/...",// official page the rule is drawn from
  lastVerified: "2026-07-08",             // date you checked it against the source
}
```

Rules for `ruleEn`:

- State only what the cited `sourceUrl` states. Do not generalise, add numbers,
  or infer entitlements the source doesn't give.
- Write it in plain English a non-native reader can follow. It will be translated
  verbatim, so ambiguity here becomes ambiguity in every language.
- It is a *reminder of an official rule*, never legal advice. Keep that framing.

When you touch a card, **re-check it against the live MOM page and update
`lastVerified`**. `test/corpus.test.ts` enforces the shape (kebab-case id,
official `mom.gov.sg` source, unique ids, lowercase keywords) but it cannot check
that the wording is *true* — that's on the human reviewer.

## Languages

`ruleEn` is the source of every translation. To enable a new language, add it to
`Language`/`LANGUAGES` and the picker. A language must not ship until a **native
reader has validated** the rule-card translations for it — a wrong rights
translation causes exactly the harm this bot exists to prevent. This is why
Burmese is implemented but gated behind `ENABLE_BURMESE=false`.

## Tests

```sh
bun run test        # 39 tests
bun run typecheck
bun run lint
```

- `test/corpus.test.ts` — corpus integrity (the trust surface).
- `test/router.test.ts` — keyword routing, with fixtures standing in for real
  questions. Add a fixture when you add a card.
- `test/reply.test.ts` — disclaimer, source link, and button wiring.
- `test/handlers.test.ts` — full request orchestration (language flow, rate cap,
  routing, photo path) with a fake Telegram client and a stubbed AI presenter.
- `test/webhook.test.ts` — the Worker fetch handler (secret check, routing).

The live Telegram → Claude round-trip is intentionally *not* unit-tested (it
needs real credentials); verify it with `wrangler dev` against a test bot.
