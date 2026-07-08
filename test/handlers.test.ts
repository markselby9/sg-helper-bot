import { beforeEach, describe, expect, it, vi } from "vitest";

// Stub the single AI call so the whole request path runs without network/secrets.
vi.mock("../src/ai.js", () => ({
  present: vi.fn(async () => "TRANSLATED_BODY"),
}));

import { present } from "../src/ai.js";
import type { Env } from "../src/config.js";
import { handleUpdate } from "../src/handlers.js";
import type { TgUpdate } from "../src/telegram.js";
import { setLanguage } from "../src/user.js";
import { FakeTelegram, makeEnv } from "./helpers.js";

const presentMock = vi.mocked(present);

function textUpdate(userId: number, text: string): TgUpdate {
  return {
    update_id: 1,
    message: { message_id: 1, from: { id: userId }, chat: { id: userId }, text },
  };
}

function photoUpdate(userId: number, fileId: string, caption?: string): TgUpdate {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      from: { id: userId },
      chat: { id: userId },
      caption,
      photo: [{ file_id: fileId, file_unique_id: "u", width: 1000, height: 800 }],
    },
  };
}

function callbackUpdate(userId: number, data: string): TgUpdate {
  return {
    update_id: 1,
    callback_query: {
      id: `cq-${userId}`,
      from: { id: userId },
      data,
      message: { message_id: 1, chat: { id: userId } },
    },
  };
}

describe("handleUpdate orchestration", () => {
  let env: Env;
  let tg: FakeTelegram;

  beforeEach(() => {
    presentMock.mockClear();
    env = makeEnv();
    tg = new FakeTelegram();
  });

  it("/start sends welcome + a language picker without the disabled Burmese", async () => {
    await handleUpdate(textUpdate(100, "/start"), env, tg.asTelegram());
    expect(tg.messages).toHaveLength(2);
    expect(tg.messages[0]?.text).toContain("Hi!");
    const langs = tg.allCallbackData();
    expect(langs).toContain("lang:en");
    expect(langs).toContain("lang:tl");
    expect(langs).toContain("lang:id");
    expect(langs).not.toContain("lang:my"); // ENABLE_BURMESE=false
    expect(presentMock).not.toHaveBeenCalled();
  });

  it("prompts for a language before answering any question", async () => {
    await handleUpdate(textUpdate(101, "my salary is late"), env, tg.asTelegram());
    expect(tg.allCallbackData()).toContain("lang:en");
    expect(presentMock).not.toHaveBeenCalled();
  });

  it("sets the chosen language and confirms", async () => {
    await handleUpdate(callbackUpdate(102, "lang:tl"), env, tg.asTelegram());
    expect(tg.answered).toContain("cq-102");
    expect(tg.messages).toHaveLength(1);
  });

  it("routes a salary question to the right card and replies with body + disclaimer + source", async () => {
    await setLanguage(env, 103, "tl");
    await handleUpdate(
      textUpdate(103, "my employer has not paid my salary this month"),
      env,
      tg.asTelegram(),
    );
    expect(presentMock).toHaveBeenCalledTimes(1);
    const arg = presentMock.mock.calls[0]?.[0];
    expect(arg?.lang).toBe("tl");
    expect(arg?.card?.id).toBe("salary-timing");
    const reply = tg.last();
    expect(reply.text).toContain("TRANSLATED_BODY");
    expect(reply.text).toContain("not legal advice");
    expect(reply.text).toContain("mom.gov.sg");
    const btns = (reply.buttons ?? []).flat().map((b) => b.callback_data);
    expect(btns).toContain("rights");
    expect(btns).toContain("card:helplines");
  });

  it("still helps (without asserting a rule) when nothing routes", async () => {
    await setLanguage(env, 104, "en");
    await handleUpdate(textUpdate(104, "hello how are you today"), env, tg.asTelegram());
    expect(presentMock).toHaveBeenCalledTimes(1);
    expect(presentMock.mock.calls[0]?.[0]?.card).toBeUndefined();
  });

  it("enforces the daily cap: the message over the limit is refused, not answered", async () => {
    env = makeEnv({ DAILY_MESSAGE_LIMIT: "1" });
    await setLanguage(env, 105, "en");
    await handleUpdate(textUpdate(105, "salary not paid"), env, tg.asTelegram());
    await handleUpdate(textUpdate(105, "salary not paid again"), env, tg.asTelegram());
    expect(presentMock).toHaveBeenCalledTimes(1);
    expect(tg.last().text).toContain("limit");
  });

  it("never rate-limits the helplines safety card", async () => {
    env = makeEnv({ DAILY_MESSAGE_LIMIT: "1" });
    await setLanguage(env, 106, "en");
    await handleUpdate(textUpdate(106, "salary not paid"), env, tg.asTelegram()); // uses the 1 unit
    await handleUpdate(callbackUpdate(106, "card:helplines"), env, tg.asTelegram());
    expect(presentMock).toHaveBeenCalledTimes(2);
    expect(presentMock.mock.calls[1]?.[0]?.card?.id).toBe("helplines");
    expect(tg.messages.some((m) => m.text.includes("limit"))).toBe(false);
  });

  it("'my rights' opens a menu with one button per rule card", async () => {
    await setLanguage(env, 107, "en");
    await handleUpdate(callbackUpdate(107, "rights"), env, tg.asTelegram());
    const datas = tg.allCallbackData();
    expect(datas).toContain("card:salary-timing");
    expect(datas).toContain("card:rest-days");
    expect(presentMock).not.toHaveBeenCalled();
  });

  it("reads a photo and passes its base64 to the presenter", async () => {
    await setLanguage(env, 108, "en");
    tg.files.set("photo-1", new Uint8Array([1, 2, 3]).buffer);
    await handleUpdate(photoUpdate(108, "photo-1"), env, tg.asTelegram());
    expect(presentMock).toHaveBeenCalledTimes(1);
    const arg = presentMock.mock.calls[0]?.[0];
    expect(arg?.imageBase64).toBe("AQID"); // base64 of [1,2,3]
    expect(arg?.userText).toBeUndefined();
  });

  it("does not spend quota on an unreadable photo", async () => {
    env = makeEnv({ DAILY_MESSAGE_LIMIT: "1" });
    await setLanguage(env, 109, "en");
    await handleUpdate(photoUpdate(109, "missing-file"), env, tg.asTelegram()); // download fails
    await handleUpdate(textUpdate(109, "salary not paid"), env, tg.asTelegram()); // still allowed
    expect(tg.messages.some((m) => m.text.includes("clearer picture"))).toBe(true);
    expect(presentMock).toHaveBeenCalledTimes(1); // the text question, not the failed photo
  });
});
