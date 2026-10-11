/**
 * Albanian is the source language: components keep their Albanian text and pass it to
 * `t()`, which looks the exact string up in the English dictionary and falls back to
 * the original. `{name}` placeholders are filled from `vars`.
 */
import en from "./en/index.js";

export const LANGS = ["sq", "en"];
export const DEFAULT_LANG = "sq";

export function translate(lang, text, vars) {
  let out = lang === "en" && Object.hasOwn(en, text) ? en[text] : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return out;
}
