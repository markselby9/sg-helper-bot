import type { RuleCard } from "./types.js";

// Verified against mom.gov.sg on 2026-07-08. Each `ruleEn` states only what the
// cited source states. When MOM updates a rule, update the text AND lastVerified.
// These are reminders of official rules, not legal advice.

export const RULE_CARDS: readonly RuleCard[] = [
  {
    id: "salary-timing",
    title: "When your salary must be paid",
    keywords: [
      "salary",
      "pay",
      "paid",
      "wage",
      "sahod",
      "gaji",
      "not paid",
      "late pay",
      "when will i be paid",
      "haven't been paid",
      "no salary",
    ],
    ruleEn:
      "Your employer must pay your salary at least once a month, no later than 7 days after the end of each salary period. If your salary is late or unpaid, you can raise it with MOM.",
    sourceUrl:
      "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/employers-guide/salary-guidelines",
    lastVerified: "2026-07-08",
  },
  {
    id: "salary-records",
    title: "Salary records and your bank account",
    keywords: [
      "salary record",
      "payslip",
      "receipt",
      "sign",
      "signature",
      "bank account",
      "bankbook",
      "atm card",
      "keep my card",
      "keep my bankbook",
      "record of payment",
      "proof of payment",
    ],
    ruleEn:
      "Your employer must keep a record of the salary they pay you, and you should keep a copy too. Where possible salary should be paid by bank transfer. You must have full access to your own bank account — your employer should not keep your bankbook or ATM card.",
    sourceUrl:
      "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/employers-guide/salary-guidelines",
    lastVerified: "2026-07-08",
  },
  {
    id: "salary-deductions",
    title: "Deductions from your salary",
    keywords: [
      "deduct",
      "deduction",
      "take money",
      "took money",
      "less salary",
      "reduced salary",
      "broke",
      "broken",
      "damage",
      "damaged",
      "fine",
      "penalty",
      "charge me",
    ],
    ruleEn:
      "Your employer generally cannot make deductions from your salary except those allowed by law. They cannot deduct money for accidental damage or loss to household items, and your salary must not be lower than the amount they declared to MOM.",
    sourceUrl:
      "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/employers-guide/salary-guidelines",
    lastVerified: "2026-07-08",
  },
  {
    id: "rest-days",
    title: "Rest days",
    keywords: [
      "rest day",
      "day off",
      "off day",
      "day out",
      "no rest",
      "no day off",
      "work on my rest day",
      "sunday off",
      "holiday",
      "araw ng pahinga",
      "hari libur",
    ],
    ruleEn:
      "You are entitled to one rest day every week. At least one rest day each month cannot be replaced with pay — it must actually be taken. If you agree to work on a rest day, your employer must pay you at least one extra day's salary on top of your basic salary.",
    sourceUrl:
      "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/employers-guide/rest-days-and-well-being",
    lastVerified: "2026-07-08",
  },
  {
    id: "six-monthly-medical",
    title: "Six-monthly medical examination (6ME)",
    keywords: [
      "6me",
      "medical",
      "medical exam",
      "medical checkup",
      "check up",
      "checkup",
      "six month",
      "6 month",
      "clinic",
      "pregnancy test",
      "who pays medical",
    ],
    ruleEn:
      "You must go for a medical examination every 6 months (called the 6ME), which screens for pregnancy and infectious diseases such as syphilis, HIV and TB. Your employer must pay for the 6ME and related medical costs. Helpers aged 50 or above do not need the 6ME and only do a medical examination when the Work Permit is renewed.",
    sourceUrl:
      "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/eligibility-and-requirements/six-monthly-medical-examination",
    lastVerified: "2026-07-08",
  },
  {
    id: "upkeep-medical",
    title: "Food, housing and medical care",
    keywords: [
      "food",
      "not enough food",
      "hungry",
      "accommodation",
      "room",
      "where i sleep",
      "sleep",
      "upkeep",
      "medical care",
      "dental",
      "doctor",
      "sick",
      "who pays doctor",
    ],
    ruleEn:
      "Your employer must provide and pay for your upkeep — this includes adequate food, a suitable place to stay, and your medical and dental care — regardless of your salary.",
    sourceUrl:
      "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/employers-guide",
    lastVerified: "2026-07-08",
  },
  {
    id: "helplines",
    title: "Who to call for help",
    keywords: [
      "help",
      "helpline",
      "emergency",
      "danger",
      "police",
      "abuse",
      "hit me",
      "scared",
      "afraid",
      "who can i call",
      "who to call",
      "call for help",
      "hotline",
      "mom number",
    ],
    ruleEn:
      "If you are in immediate danger, call the Police at 999. You can call the MOM helpline for domestic workers at 1800 339 5505 (Monday to Friday, 8:30am to 5:30pm). The Centre for Domestic Employees (CDE) has a 24-hour helpline at 1800 2255 233. HOME also runs a helpline at +65 9787 3122 (call, SMS or WhatsApp).",
    sourceUrl: "https://www.mom.gov.sg/faq/work-permit-for-fdw/i-am-an-mdw-in-distress",
    lastVerified: "2026-07-08",
  },
] as const;

/** Look up a card by id. */
export function cardById(id: string): RuleCard | undefined {
  return RULE_CARDS.find((c) => c.id === id);
}
