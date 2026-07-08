import { describe, expect, it } from "vitest";
import { RULE_CARDS, cardById } from "../src/corpus/cards.js";

// The corpus is the trust surface. These tests guard its shape and integrity so
// a careless edit can't ship a malformed, unsourced, or duplicated rule.

describe("rule-card corpus", () => {
  it("has cards", () => {
    expect(RULE_CARDS.length).toBeGreaterThan(0);
  });

  it("every card is well-formed", () => {
    for (const card of RULE_CARDS) {
      expect(card.id, "id").toMatch(/^[a-z0-9-]+$/);
      expect(card.title.length, `${card.id} title`).toBeGreaterThan(0);
      expect(card.keywords.length, `${card.id} keywords`).toBeGreaterThan(0);
      expect(card.ruleEn.length, `${card.id} ruleEn`).toBeGreaterThan(20);
      expect(card.lastVerified, `${card.id} lastVerified`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every card cites an official mom.gov.sg source", () => {
    for (const card of RULE_CARDS) {
      expect(card.sourceUrl, card.id).toMatch(/^https:\/\/www\.mom\.gov\.sg\//);
    }
  });

  it("card ids are unique", () => {
    const ids = RULE_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keywords are lowercase (router lowercases input before matching)", () => {
    for (const card of RULE_CARDS) {
      for (const kw of card.keywords) {
        expect(kw, `${card.id}:"${kw}"`).toBe(kw.toLowerCase());
      }
    }
  });

  it("includes the helplines card (safety net that is never rate-limited)", () => {
    expect(cardById("helplines")).toBeDefined();
  });

  it("cardById returns undefined for unknown ids", () => {
    expect(cardById("does-not-exist")).toBeUndefined();
  });
});
