import { RULE_CARDS } from "./cards.js";
import type { RuleCard } from "./types.js";

export interface RouteMatch {
  card: RuleCard;
  /** Number of distinct keywords that matched. Higher = more confident. */
  score: number;
}

/**
 * Deterministic keyword router. Given a user's message, return the rule cards
 * whose keywords appear in it, ranked most-relevant first. This is intentionally
 * NOT an AI call: card selection is auditable code, so the model can never
 * surface a rule the corpus didn't hand it. Returns [] when nothing matches, in
 * which case the caller must decline rather than guess.
 */
export function route(message: string): RouteMatch[] {
  const haystack = ` ${message.toLowerCase()} `;
  const matches: RouteMatch[] = [];

  for (const card of RULE_CARDS) {
    let score = 0;
    for (const keyword of card.keywords) {
      if (haystack.includes(keyword.toLowerCase())) score += 1;
    }
    if (score > 0) matches.push({ card, score });
  }

  return matches.sort((a, b) => b.score - a.score);
}

/** The single best-matching card, or undefined if nothing matched. */
export function bestMatch(message: string): RuleCard | undefined {
  return route(message)[0]?.card;
}
