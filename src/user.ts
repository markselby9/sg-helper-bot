import { type Env, dailyLimit } from "./config.js";
import type { Language } from "./corpus/types.js";

// Per-user state stored in KV. We deliberately store NO document or message
// content — only a language preference and a daily message counter (with a TTL),
// keyed by the Telegram user id. This is what keeps the bot privacy-clean and
// caps cost: no surveillance surface, and a hard per-user ceiling on AI calls.

interface UserState {
  lang?: Language;
  /** Messages counted in the current UTC day. */
  count: number;
  /** UTC date string (YYYY-MM-DD) the count belongs to. */
  day: string;
}

const TTL_SECONDS = 60 * 60 * 48; // 2 days; counter self-expires.

function key(userId: number): string {
  return `u:${userId}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function read(env: Env, userId: number): Promise<UserState> {
  const raw = await env.USERS.get(key(userId));
  if (!raw) return { count: 0, day: today() };
  try {
    const parsed = JSON.parse(raw) as UserState;
    return parsed.day === today() ? parsed : { lang: parsed.lang, count: 0, day: today() };
  } catch {
    return { count: 0, day: today() };
  }
}

async function write(env: Env, userId: number, state: UserState): Promise<void> {
  await env.USERS.put(key(userId), JSON.stringify(state), { expirationTtl: TTL_SECONDS });
}

export async function getLanguage(env: Env, userId: number): Promise<Language | undefined> {
  return (await read(env, userId)).lang;
}

export async function setLanguage(env: Env, userId: number, lang: Language): Promise<void> {
  const state = await read(env, userId);
  await write(env, userId, { ...state, lang });
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Atomically-ish increment the daily counter and report whether this message is
 * within the limit. (KV is eventually consistent, so this is a soft cap — good
 * enough to bound cost; it is not a security control.)
 */
export async function consume(env: Env, userId: number): Promise<RateResult> {
  const limit = dailyLimit(env);
  const state = await read(env, userId);
  if (state.count >= limit) return { allowed: false, remaining: 0 };
  const next = { ...state, count: state.count + 1 };
  await write(env, userId, next);
  return { allowed: true, remaining: limit - next.count };
}
