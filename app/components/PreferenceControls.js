"use client";

import { Moon, Sun } from "lucide-react";
import { usePreferences, useT } from "./Preferences";

/** Language (SQ | EN) and light/dark switches, shared by the desktop bar and the mobile menu. */
export default function PreferenceControls({ className = "" }) {
  const { lang, setLang, theme, setTheme } = usePreferences();
  const t = useT();
  const dark = theme === "dark";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div role="group" aria-label={t("Gjuha")} className="inline-flex rounded-full border border-gray-200 bg-surface/80 p-0.5 text-xs font-bold">
        {[
          ["sq", "SQ"],
          ["en", "EN"],
        ].map(([code, label]) => (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
            className={`min-h-[32px] min-w-[36px] rounded-full px-2 transition-colors ${
              lang === code ? "bg-burgundy-600 text-white" : "text-gray-600 hover:text-navy-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(dark ? "light" : "dark")}
        aria-label={dark ? t("Tema e çelët") : t("Tema e errët")}
        title={dark ? t("Tema e çelët") : t("Tema e errët")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-surface/80 text-gray-600 transition-colors hover:text-burgundy-600"
      >
        {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
