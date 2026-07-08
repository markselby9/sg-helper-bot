import { describe, expect, it } from "vitest";
import { cardById } from "../src/corpus/cards.js";
import { composeAnswer, languagePicker, quickButtons, rightsMenu } from "../src/reply.js";

describe("reply composition", () => {
  it("always appends the not-legal-advice disclaimer", () => {
    const out = composeAnswer("en", "Here is what your payslip says.");
    expect(out).toContain("not legal advice");
    expect(out).toContain("1800 339 5505");
  });

  it("includes the source link when a rule card is used", () => {
    const card = cardById("rest-days");
    const out = composeAnswer("en", "You get one rest day a week.", card);
    expect(out).toContain(card?.sourceUrl);
    expect(out).toContain(card?.title);
  });

  it("omits the source block when no card is used", () => {
    const out = composeAnswer("en", "This letter is about your work permit renewal.");
    expect(out).not.toContain("📄");
  });

  it("quick buttons offer rights + help navigation", () => {
    const rows = quickButtons("en");
    const datas = rows.flat().map((b) => b.callback_data);
    expect(datas).toContain("rights");
    expect(datas).toContain("card:helplines");
  });

  it("rights menu has one button per rule card, all valid ids", () => {
    for (const row of rightsMenu()) {
      const btn = row[0];
      expect(btn?.callback_data).toMatch(/^card:/);
      expect(cardById(btn?.callback_data.slice("card:".length) ?? "")).toBeDefined();
    }
  });

  it("language picker builds one button per language", () => {
    const rows = languagePicker(["en", "tl", "id"], {
      en: "English",
      tl: "Tagalog",
      id: "Bahasa Indonesia",
      my: "Burmese",
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]?.[0]?.callback_data).toBe("lang:en");
  });
});
