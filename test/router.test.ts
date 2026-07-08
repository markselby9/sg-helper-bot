import { describe, expect, it } from "vitest";
import { RULE_CARDS } from "../src/corpus/cards.js";
import { bestMatch, route } from "../src/corpus/router.js";

// Routing is deterministic code, so it can be asserted directly. These fixtures
// stand in for real questions a worker might type.

describe("router", () => {
  const cases: Array<[string, string]> = [
    ["My employer has not paid my salary this month", "salary-timing"],
    ["can my boss deduct money because i broke a plate", "salary-deductions"],
    ["employer keeps my atm card and bankbook", "salary-records"],
    ["I did not get any rest day this month", "rest-days"],
    ["when is my 6 monthly medical checkup and who pays", "six-monthly-medical"],
    ["there is not enough food and i am hungry", "upkeep-medical"],
    ["I am scared, my employer hit me, who can I call", "helplines"],
  ];

  for (const [message, expected] of cases) {
    it(`routes "${message}" -> ${expected}`, () => {
      expect(bestMatch(message)?.id).toBe(expected);
    });
  }

  it("returns no match for unrelated text (caller must decline, not guess)", () => {
    expect(route("what is the weather like today in tokyo")).toEqual([]);
    expect(bestMatch("random unrelated chit chat")).toBeUndefined();
  });

  it("ranks the more-specific card first when keywords overlap", () => {
    const matches = route("my salary was deducted for a broken vase");
    expect(matches.length).toBeGreaterThan(0);
    // "deduct"/"broken"/"broke" are stronger signals than the lone "salary".
    expect(matches[0]?.card.id).toBe("salary-deductions");
  });

  it("only ever returns cards from the corpus", () => {
    const ids = new Set(RULE_CARDS.map((c) => c.id));
    for (const m of route("salary rest day medical food help deduction")) {
      expect(ids.has(m.card.id)).toBe(true);
    }
  });
});
