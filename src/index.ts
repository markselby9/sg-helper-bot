import type { Env } from "./config.js";
import { handleUpdate } from "./handlers.js";
import { Telegram, type TgUpdate } from "./telegram.js";

// Cloudflare Worker entry. Telegram POSTs updates to `/webhook`. We verify the
// secret header, acknowledge immediately (Telegram retries on non-200), and
// process the update within the request lifetime.
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("sg-helper-bot is running.", { status: 200 });
    }

    if (request.method === "POST" && url.pathname === "/webhook") {
      const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }

      let update: TgUpdate;
      try {
        update = (await request.json()) as TgUpdate;
      } catch {
        return new Response("bad request", { status: 400 });
      }

      const tg = new Telegram(env.TELEGRAM_BOT_TOKEN);
      ctx.waitUntil(handleUpdate(update, env, tg));
      return new Response("ok", { status: 200 });
    }

    return new Response("not found", { status: 404 });
  },
};
