import { present } from "./ai.js";
import { type Env, enabledLanguages } from "./config.js";
import { t } from "./copy.js";
import { cardById } from "./corpus/cards.js";
import { bestMatch } from "./corpus/router.js";
import { LANGUAGE_NAMES, type Language } from "./corpus/types.js";
import { composeAnswer, languagePicker, quickButtons, rightsMenu } from "./reply.js";
import { type Telegram, type TgMessage, type TgUpdate, toBase64 } from "./telegram.js";
import { consume, getLanguage, setLanguage } from "./user.js";

/** Route a Telegram update to the right handler. Never throws to the caller. */
export async function handleUpdate(update: TgUpdate, env: Env, tg: Telegram): Promise<void> {
  try {
    if (update.message) await handleMessage(update.message, env, tg);
    else if (update.callback_query) await handleCallback(update.callback_query, env, tg);
  } catch {
    // Best-effort: never let one bad update crash the worker.
  }
}

async function handleMessage(msg: TgMessage, env: Env, tg: Telegram): Promise<void> {
  const userId = msg.from?.id;
  if (!userId) return;
  const chatId = msg.chat.id;
  const text = (msg.text ?? msg.caption ?? "").trim();

  if (text.startsWith("/start")) {
    await sendWelcome(chatId, env, tg);
    return;
  }

  const lang = await getLanguage(env, userId);
  if (!lang) {
    await promptLanguage(chatId, env, tg);
    return;
  }

  const hasPhoto = Boolean(msg.photo && msg.photo.length > 0);
  if (!text && !hasPhoto) return;

  // Fetch the photo (free) before spending quota, so an unreadable photo never
  // burns a message. The daily cap sits directly in front of the AI call.
  let imageBase64: string | undefined;
  if (hasPhoto && msg.photo) {
    const largest = msg.photo[msg.photo.length - 1];
    if (largest) {
      const buf = await tg.downloadFile(largest.file_id);
      if (!buf) {
        await tg.sendMessage(chatId, t(lang).photoUnreadable);
        return;
      }
      imageBase64 = toBase64(buf);
    }
  }

  const rate = await consume(env, userId);
  if (!rate.allowed) {
    await tg.sendMessage(chatId, t(lang).rateLimited);
    return;
  }

  const card = text ? bestMatch(text) : undefined;
  await respond(chatId, lang, env, tg, { userText: text || undefined, imageBase64, card });
}

async function handleCallback(
  cb: NonNullable<TgUpdate["callback_query"]>,
  env: Env,
  tg: Telegram,
): Promise<void> {
  await tg.answerCallbackQuery(cb.id);
  const userId = cb.from.id;
  const chatId = cb.message?.chat.id;
  if (!chatId) return;
  const data = cb.data ?? "";

  if (data.startsWith("lang:")) {
    const lang = data.slice("lang:".length) as Language;
    if (!enabledLanguages(env).includes(lang)) return;
    await setLanguage(env, userId, lang);
    await tg.sendMessage(chatId, t(lang).languageSet);
    return;
  }

  const lang = (await getLanguage(env, userId)) ?? "en";

  if (data === "rights") {
    await tg.sendMessage(chatId, t(lang).btnMyRights, rightsMenu());
    return;
  }

  if (data.startsWith("card:")) {
    const card = cardById(data.slice("card:".length));
    if (!card) return;
    // Helplines are safety information and are never rate-limited. Other rule
    // cards count against the daily limit like a normal question.
    if (card.id !== "helplines") {
      const rate = await consume(env, userId);
      if (!rate.allowed) {
        await tg.sendMessage(chatId, t(lang).rateLimited);
        return;
      }
    }
    await respond(chatId, lang, env, tg, {
      userText: `The worker wants to understand this rule: ${card.title}.`,
      card,
    });
  }
}

interface RespondInput {
  userText?: string;
  imageBase64?: string;
  card?: ReturnType<typeof bestMatch>;
}

async function respond(
  chatId: number,
  lang: Language,
  env: Env,
  tg: Telegram,
  input: RespondInput,
): Promise<void> {
  try {
    const body = await present({
      apiKey: env.ANTHROPIC_API_KEY,
      lang,
      userText: input.userText,
      imageBase64: input.imageBase64,
      imageMediaType: input.imageBase64 ? "image/jpeg" : undefined,
      card: input.card,
    });
    await tg.sendMessage(chatId, composeAnswer(lang, body, input.card), quickButtons(lang));
  } catch {
    await tg.sendMessage(chatId, t(lang).error);
  }
}

async function sendWelcome(chatId: number, env: Env, tg: Telegram): Promise<void> {
  // Show the welcome + picker in English (the shared onboarding language); the
  // worker sets her real language with one tap.
  await tg.sendMessage(chatId, t("en").welcome);
  await promptLanguage(chatId, env, tg);
}

async function promptLanguage(chatId: number, env: Env, tg: Telegram): Promise<void> {
  const langs = enabledLanguages(env);
  await tg.sendMessage(chatId, t("en").pickLanguage, languagePicker(langs, LANGUAGE_NAMES));
}
