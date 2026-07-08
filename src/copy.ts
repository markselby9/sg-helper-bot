import type { Language } from "./corpus/types.js";

// Static, human-written UI strings. These are NOT AI-translated: onboarding,
// consent, and the legal disclaimer must be exact and stable in every language.
// (Burmese strings are placeholders pending native-reader validation; the
// language stays disabled in production until then — see docs/design.md.)

type Strings = {
  welcome: string;
  pickLanguage: string;
  languageSet: string;
  disclaimer: string;
  cannotVerify: string;
  outOfScope: string;
  rateLimited: string;
  photoUnreadable: string;
  error: string;
  btnExplainMore: string;
  btnMyRights: string;
  btnGetHelp: string;
  original: string;
  translation: string;
};

const EN: Strings = {
  welcome:
    "Hi! Send me any confusing English message, payslip, contract, or letter, and I'll explain it in your language and tell you your rights as a domestic worker in Singapore. You can send text or a photo.\n\nI don't store your documents. I'm not affiliated with MOM, and this is information, not legal advice.",
  pickLanguage: "First, choose your language:",
  languageSet: "Done! Now send me anything you'd like explained.",
  disclaimer:
    "ℹ️ This is a reminder of official rules, not legal advice. For help, call MOM 1800 339 5505 or CDE 1800 2255 233 (24h).",
  cannotVerify:
    "I can't verify the official rule for this one. Please call the MOM helpline at 1800 339 5505 (Mon–Fri, 8:30am–5:30pm) or CDE at 1800 2255 233 (24 hours).",
  outOfScope:
    "I can only help with understanding documents and your rights as a domestic worker in Singapore. For other help, call MOM at 1800 339 5505.",
  rateLimited:
    "You've reached today's limit. Please try again tomorrow. If this is urgent, call the CDE 24-hour helpline at 1800 2255 233.",
  photoUnreadable:
    "I couldn't read that photo clearly. Please send a clearer picture, or type the words instead.",
  error: "Something went wrong. Please try again in a moment.",
  btnExplainMore: "Explain more",
  btnMyRights: "My rights",
  btnGetHelp: "Get help",
  original: "Original",
  translation: "In your language",
};

// Onboarding/consent in each helper language so the FIRST message is understood.
const OVERRIDES: Partial<Record<Language, Partial<Strings>>> = {
  tl: {
    welcome:
      "Kumusta! Ipadala mo sa akin ang kahit anong nakakalitong mensahe, payslip, kontrata, o sulat sa Ingles, at ipapaliwanag ko ito sa wika mo at sasabihin ang iyong mga karapatan bilang domestic worker sa Singapore. Puwede kang magpadala ng text o larawan.\n\nHindi ko iniimbak ang iyong mga dokumento. Hindi ako konektado sa MOM, at ito ay impormasyon, hindi legal na payo.",
    pickLanguage: "Una, piliin ang iyong wika:",
    languageSet: "Tapos na! Ipadala mo na ang gusto mong ipaliwanag.",
  },
  id: {
    welcome:
      "Halo! Kirimkan pesan, slip gaji, kontrak, atau surat berbahasa Inggris yang membingungkan, dan saya akan menjelaskannya dalam bahasa Anda serta memberi tahu hak Anda sebagai pekerja rumah tangga di Singapura. Anda bisa mengirim teks atau foto.\n\nSaya tidak menyimpan dokumen Anda. Saya tidak berafiliasi dengan MOM, dan ini informasi, bukan nasihat hukum.",
    pickLanguage: "Pertama, pilih bahasa Anda:",
    languageSet: "Selesai! Sekarang kirim apa pun yang ingin Anda pahami.",
  },
};

export function t(lang: Language): Strings {
  return { ...EN, ...(OVERRIDES[lang] ?? {}) };
}
