import type { Language } from "./corpus/types.js";

/** Cloudflare Worker bindings + secrets. Secrets are set via `wrangler secret put`. */
export interface Env {
  USERS: KVNamespace;
  ANTHROPIC_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  ENABLE_BURMESE: string;
  DAILY_MESSAGE_LIMIT: string;
}

/** Cheap multimodal model — see docs; keeps per-message cost in fractions of a cent. */
export const MODEL = "claude-haiku-4-5";

/** Languages offered in the picker, gating Burmese behind ENABLE_BURMESE. */
export function enabledLanguages(env: Env): Language[] {
  const base: Language[] = ["en", "tl", "id"];
  if (env.ENABLE_BURMESE === "true") base.push("my");
  return base;
}

export function dailyLimit(env: Env): number {
  const n = Number.parseInt(env.DAILY_MESSAGE_LIMIT ?? "20", 10);
  return Number.isFinite(n) && n > 0 ? n : 20;
}
