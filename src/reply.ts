import { t } from "./copy.js";
import { RULE_CARDS } from "./corpus/cards.js";
import type { Language, RuleCard } from "./corpus/types.js";
import type { InlineButton } from "./telegram.js";

// Assembles the final message: the AI body, the verified source link when a rule
// was used, and the standing disclaimer. Also builds the quick-reply buttons.
// Buttons are deliberately stateless (the bot stores no conversation), so they
// offer navigation ("my rights", "get help") rather than "explain more".

export function composeAnswer(lang: Language, body: string, card?: RuleCard): string {
  const s = t(lang);
  const parts = [body];
  if (card) parts.push(`\n📄 ${card.title}\n${card.sourceUrl}`);
  parts.push(`\n${s.disclaimer}`);
  return parts.join("\n");
}

export function quickButtons(lang: Language): InlineButton[][] {
  const s = t(lang);
  return [
    [
      { text: s.btnMyRights, callback_data: "rights" },
      { text: s.btnGetHelp, callback_data: "card:helplines" },
    ],
  ];
}

/** Menu of rights topics, one button per rule card. */
export function rightsMenu(): InlineButton[][] {
  return RULE_CARDS.map((c) => [{ text: c.title, callback_data: `card:${c.id}` }]);
}

export function languagePicker(
  languages: readonly Language[],
  names: Record<Language, string>,
): InlineButton[][] {
  return languages.map((l) => [{ text: names[l], callback_data: `lang:${l}` }]);
}
