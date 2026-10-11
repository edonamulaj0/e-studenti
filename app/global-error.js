"use client";

import { useEffect, useState } from "react";

/**
 * Last-resort boundary for errors in the root layout itself (error.js cannot
 * catch those). It replaces the whole document, so it carries its own <html>
 * and plain inline styles rather than relying on the app's CSS.
 */
const STRINGS = {
  sq: {
    title: "Diçka shkoi keq",
    text: "Faqja nuk u ngarkua dot. Provoni përsëri ose kthehuni në ballinë.",
    retry: "Provo përsëri",
    home: "Ballina",
  },
  en: {
    title: "Something went wrong",
    text: "The page could not be loaded. Try again or go back to the home page.",
    retry: "Try again",
    home: "Home",
  },
};

export default function GlobalError({ reset }) {
  // No provider here. Start in Albanian (matches the prerender) and switch after mount.
  const [lang, setLang] = useState("sq");
  useEffect(() => {
    try {
      if (localStorage.getItem("estudenti-lang") === "en") setLang("en");
    } catch {
      /* storage can be unavailable */
    }
  }, []);
  const s = STRINGS[lang];

  return (
    <html lang={lang}>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdfbf7",
          color: "#1a2332",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <main>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{s.title}</h1>
          <p style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
            {s.text}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#8b3a3a",
              color: "#fff",
              border: 0,
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s.retry}
          </button>{" "}
          {/* A plain link on purpose: this boundary replaces the whole document and
              the router may be the thing that failed, so a full page load is safer. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#8b3a3a", fontWeight: 600 }}>
            {s.home}
          </a>
        </main>
      </body>
    </html>
  );
}
