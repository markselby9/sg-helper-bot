# sg-helper-bot

A Telegram bot for **Singapore migrant domestic workers**. Send it any confusing
English thing — a payslip, a contract, a message from your employer, an MOM
letter — and it explains it **in your language** (Tagalog, Bahasa Indonesia,
English) and tells you your rights as a domestic worker in Singapore.

It stores no documents, has no employer side, and is not affiliated with MOM.
What it tells you are reminders of official rules, **not legal advice**.

## How it works

The bot is deliberately mostly **not** AI. Official rules live in a small,
human-verified, test-covered corpus (`src/corpus/cards.ts`) — the trust surface.
A deterministic keyword router picks the relevant rule; the AI (Claude Haiku 4.5)
only **translates and explains** the worker's own message and the matched rule.
It is never allowed to assert a rule from its own knowledge. If nothing matches,
the bot points to the MOM/CDE helplines rather than guessing.

See [`docs/design.md`](docs/design.md) for the full design and rationale.

```
Telegram ─▶ Cloudflare Worker ─▶ keyword router ─▶ verified rule card
                                          └─▶ Claude Haiku 4.5 (translate/explain only)
```

## Stack

TypeScript · Bun · Cloudflare Workers + KV · Anthropic Haiku 4.5 · Vitest · Biome.

## Develop

```sh
bun install
bun run test        # unit tests (corpus, router, reply)
bun run typecheck
bun run lint
cp .dev.vars.example .dev.vars   # fill in secrets, then:
bun run dev         # local worker at http://localhost:8787
```

## Deploy

1. **Create the bot** with [@BotFather](https://t.me/botfather) → get the token.
2. **Create the KV namespace** and paste its id into `wrangler.jsonc`:
   ```sh
   bunx wrangler kv namespace create USERS
   ```
3. **Set secrets** (never commit these):
   ```sh
   bunx wrangler secret put ANTHROPIC_API_KEY
   bunx wrangler secret put TELEGRAM_BOT_TOKEN
   bunx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # any long random string
   ```
4. **Deploy:**
   ```sh
   bun run deploy
   ```
5. **Register the webhook** with Telegram (use the same secret as step 3):
   ```sh
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://sg-helper-bot.<your-subdomain>.workers.dev/webhook" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```

## Configuration

Non-secret vars live in `wrangler.jsonc`:

| Var | Default | Meaning |
| --- | --- | --- |
| `ENABLE_BURMESE` | `false` | Burmese is implemented but stays off until a native reader validates the rule-card translations. |
| `DAILY_MESSAGE_LIMIT` | `20` | Per-user daily cap on AI calls (bounds cost). The helplines card is never rate-limited. |

## Cost & funding

Designed to run at coffee-money scale: cheap model, a small cacheable corpus, and
a hard per-user daily cap. The intended posture is free-and-capped; infra/AI
credits (e.g. Cloudflare Project Galileo, LLM social-good credits) are worth
chasing only if it gets real usage.

## Status

v1 wedge: paste/photo → explain + translate + rights check. Deferred to later:
personal 6ME/permit reminders, WhatsApp/web channels. This is a social-good
project — contributions and corrections to the rule corpus are welcome.

## License

MIT
