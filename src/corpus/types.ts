// The rule-card corpus is the trust surface of this bot: the ONLY place allowed
// to assert what an MOM rule is. The AI layer may translate and explain a card,
// but must never author a rule from its own training. Every card is a verbatim,
// human-verified statement of an official rule with a citable source, and is
// covered by tests in test/corpus.test.ts. Treat edits here like edits to a
// financial engine: verify against mom.gov.sg and update `lastVerified`.

/** Languages the bot can present in. `en` is the source language of every card. */
export type Language = "en" | "tl" | "id" | "my";

export const LANGUAGES: readonly Language[] = ["en", "tl", "id", "my"] as const;

/** Human-readable names, shown in the language picker in each language's script. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  tl: "Tagalog",
  id: "Bahasa Indonesia",
  my: "မြန်မာ (Burmese)",
};

export interface RuleCard {
  /** Stable kebab-case id. Never reuse or repurpose an id. */
  id: string;
  /** Short human-facing title for the rule. */
  title: string;
  /**
   * Lowercase keywords/phrases that route a user question to this card. Matched
   * as substrings against the lowercased message. Keep them specific enough that
   * unrelated questions do not match.
   */
  keywords: readonly string[];
  /**
   * The verified rule, in plain English. This exact text is what the AI is
   * allowed to translate/explain — it must not add rules beyond it.
   */
  ruleEn: string;
  /** Official source the rule is drawn from. */
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) the rule text was last checked against the source. */
  lastVerified: string;
}
