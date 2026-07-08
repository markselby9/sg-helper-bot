import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./config.js";
import type { Language, RuleCard } from "./corpus/types.js";

const TARGET_LANGUAGE: Record<Language, string> = {
  en: "English",
  tl: "Tagalog (Filipino)",
  id: "Bahasa Indonesia",
  my: "Burmese (Myanmar)",
};

// The AI is the PRESENTATION layer only. It translates and explains the user's
// own content, and — when a verified rule card is supplied — restates that card
// faithfully in the target language. It is forbidden from asserting any rule
// from its own knowledge; rule authority lives solely in the corpus.
function systemPrompt(lang: Language, hasCard: boolean): string {
  const language = TARGET_LANGUAGE[lang];
  return [
    `You help a migrant domestic worker in Singapore understand documents and messages. Reply ONLY in ${language}, in short, simple, warm sentences a non-native English reader can follow. Use no markdown.`,
    "Your job has two parts:",
    "1. Explain, in plain terms, what the message/document the worker sent actually says or asks for.",
    hasCard
      ? "2. A VERIFIED OFFICIAL RULE is provided below. Restate it faithfully and simply in the target language so the worker knows her rights. Do NOT add, generalise, or invent any rule, number, deadline, or legal claim beyond what the verified rule states."
      : "2. No verified rule applies here, so do not state any rule or legal fact. Just help her understand the message.",
    "Never give legal advice or tell her what she must do. Never guess amounts, dates, or entitlements. If something is unclear, say so plainly.",
  ].join("\n");
}

export interface PresenterInput {
  apiKey: string;
  userText?: string;
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/webp";
  card?: RuleCard;
  lang: Language;
}

/**
 * Produce the body of the reply: a plain-language explanation + translation of
 * the worker's content, plus a faithful translation of the matched rule card.
 * Throws on API failure so the caller can send a graceful error message.
 */
export async function present(input: PresenterInput): Promise<string> {
  const client = new Anthropic({ apiKey: input.apiKey });

  const content: Anthropic.ContentBlockParam[] = [];
  if (input.imageBase64 && input.imageMediaType) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.imageMediaType, data: input.imageBase64 },
    });
  }

  const parts: string[] = [];
  if (input.userText) parts.push(`The worker sent this message:\n"""\n${input.userText}\n"""`);
  else if (input.imageBase64)
    parts.push("The worker sent the attached image. Read any text in it.");
  if (input.card) {
    parts.push(
      `VERIFIED OFFICIAL RULE (restate faithfully, do not add to it):\n"""\n${input.card.ruleEn}\n"""`,
    );
  }
  content.push({ type: "text", text: parts.join("\n\n") });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    system: systemPrompt(input.lang, Boolean(input.card)),
    messages: [{ role: "user", content }],
  });

  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
