"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, translate } from "../lib/i18n";

const LANG_KEY = "estudenti-lang";
const THEME_KEY = "estudenti-theme";

const PreferencesContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  theme: "light",
  setTheme: () => {},
});

/** Runs before first paint (inlined in <head>) so the saved theme and language never flash. */
export const PREFERENCES_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem("${THEME_KEY}");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t;var l=localStorage.getItem("${LANG_KEY}");if(l==="en"||l==="sq")d.lang=l}catch(e){}`;

export default function PreferencesProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [theme, setThemeState] = useState("light");

  // Read what the head script applied. Doing it after mount keeps the first client render
  // identical to the prerendered Albanian/light HTML, so hydration never mismatches.
  useEffect(() => {
    setThemeState(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "sq") setLangState(saved);
    } catch {
      /* storage can be unavailable */
    }
  }, []);

  const setLang = useCallback((next) => {
    setLangState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang, theme, setTheme }), [lang, setLang, theme, setTheme]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => useContext(PreferencesContext);

/** `const t = useT(); t("Shiko materialet")`, `t("{n} materiale", { n: 3 })`. */
export function useT() {
  const { lang } = useContext(PreferencesContext);
  return useCallback((text, vars) => translate(lang, text, vars), [lang]);
}

/** Current language code, for locale-aware formatting. */
export const useLang = () => useContext(PreferencesContext).lang;

/** Translates plain text children; for server components that cannot call hooks. */
export function T({ children, vars }) {
  const t = useT();
  return typeof children === "string" ? t(children, vars) : children;
}
