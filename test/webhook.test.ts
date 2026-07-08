import { beforeEach, describe, expect, it, vi } from "vitest";

// Isolate the Worker fetch handler from the orchestration it delegates to.
vi.mock("../src/handlers.js", () => ({
  handleUpdate: vi.fn(async () => {}),
}));

import type { Env } from "../src/config.js";
import { handleUpdate } from "../src/handlers.js";
import worker from "../src/index.js";
import { makeEnv } from "./helpers.js";

const handleMock = vi.mocked(handleUpdate);

// Minimal ExecutionContext: run the awaited work synchronously enough for tests.
const ctx = {
  waitUntil: (_p: Promise<unknown>) => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

function webhookRequest(secret: string | null, body: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret !== null) headers["X-Telegram-Bot-Api-Secret-Token"] = secret;
  return new Request("https://bot.example/webhook", { method: "POST", headers, body });
}

describe("worker fetch handler", () => {
  let env: Env;

  beforeEach(() => {
    handleMock.mockClear();
    env = makeEnv({ TELEGRAM_WEBHOOK_SECRET: "test-secret" });
  });

  it("GET / is a health check", async () => {
    const res = await worker.fetch(new Request("https://bot.example/"), env, ctx);
    expect(res.status).toBe(200);
  });

  it("rejects a webhook with the wrong secret and does not process it", async () => {
    const res = await worker.fetch(
      webhookRequest("wrong", JSON.stringify({ update_id: 1 })),
      env,
      ctx,
    );
    expect(res.status).toBe(403);
    expect(handleMock).not.toHaveBeenCalled();
  });

  it("rejects a webhook with a missing secret", async () => {
    const res = await worker.fetch(
      webhookRequest(null, JSON.stringify({ update_id: 1 })),
      env,
      ctx,
    );
    expect(res.status).toBe(403);
    expect(handleMock).not.toHaveBeenCalled();
  });

  it("accepts a valid webhook and dispatches the update", async () => {
    const res = await worker.fetch(
      webhookRequest("test-secret", JSON.stringify({ update_id: 1, message: { chat: { id: 1 } } })),
      env,
      ctx,
    );
    expect(res.status).toBe(200);
    expect(handleMock).toHaveBeenCalledTimes(1);
  });

  it("400s on a malformed body without dispatching", async () => {
    const res = await worker.fetch(webhookRequest("test-secret", "not json{"), env, ctx);
    expect(res.status).toBe(400);
    expect(handleMock).not.toHaveBeenCalled();
  });

  it("404s on unknown routes", async () => {
    const res = await worker.fetch(new Request("https://bot.example/nope"), env, ctx);
    expect(res.status).toBe(404);
  });
});
