import type { Env } from "../src/config.js";
import type { InlineButton, Telegram } from "../src/telegram.js";

// Test doubles for the integration tests. These let us drive the full
// orchestration (handlers, KV state, rate limiting, routing) without any network
// or secrets — the only thing stubbed out is the AI presenter itself.

/** Minimal in-memory KVNamespace (get/put only; TTL ignored). */
export function memoryKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
  } as unknown as KVNamespace;
}

export function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    USERS: memoryKv(),
    ANTHROPIC_API_KEY: "test-key",
    TELEGRAM_BOT_TOKEN: "test-token",
    TELEGRAM_WEBHOOK_SECRET: "test-secret",
    ENABLE_BURMESE: "false",
    DAILY_MESSAGE_LIMIT: "20",
    ...overrides,
  };
}

export interface SentMessage {
  chatId: number;
  text: string;
  buttons?: InlineButton[][];
}

/** Records outbound Telegram calls instead of hitting the API. */
export class FakeTelegram {
  messages: SentMessage[] = [];
  answered: string[] = [];
  /** file_id -> bytes returned by downloadFile; missing id returns null. */
  files = new Map<string, ArrayBuffer>();

  async sendMessage(chatId: number, text: string, buttons?: InlineButton[][]) {
    this.messages.push({ chatId, text, buttons });
  }

  async answerCallbackQuery(id: string) {
    this.answered.push(id);
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer | null> {
    return this.files.get(fileId) ?? null;
  }

  /** All callback_data across every button of every sent message. */
  allCallbackData(): string[] {
    return this.messages.flatMap((m) => (m.buttons ?? []).flat().map((b) => b.callback_data));
  }

  last(): SentMessage {
    const m = this.messages.at(-1);
    if (!m) throw new Error("no messages sent");
    return m;
  }

  asTelegram(): Telegram {
    return this as unknown as Telegram;
  }
}
