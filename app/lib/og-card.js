import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * Link previews (Open Graph images) for Viber, WhatsApp, Facebook, X and
 * search results, rendered to PNG at build time. The site's own faces and
 * colours, so a shared exam paper is recognisably E-Studenti.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#1a2332";
const BURGUNDY = "#8b3a3a";
const CREAM = "#fdfbf7";
const MUTED = "#4a5568";

const FONT_DIR = path.join(process.cwd(), "node_modules/@fontsource");
let fontsPromise;
function loadFonts() {
  fontsPromise ||= Promise.all([
    readFile(path.join(FONT_DIR, "playfair-display/files/playfair-display-latin-700-normal.woff")),
    readFile(path.join(FONT_DIR, "montserrat/files/montserrat-latin-500-normal.woff")),
    readFile(path.join(FONT_DIR, "montserrat/files/montserrat-latin-600-normal.woff")),
  ]).then(([playfair, montserrat, montserratBold]) => [
    { name: "Playfair", data: playfair, weight: 700, style: "normal" },
    { name: "Montserrat", data: montserrat, weight: 500, style: "normal" },
    { name: "Montserrat", data: montserratBold, weight: 600, style: "normal" },
  ]);
  return fontsPromise;
}

/** Shortens text at a word boundary so it fits the card. */
function clip(text, max) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 12)).trim()}…`;
}

/**
 * @param {{ eyebrow?: string, title: string, meta?: string, badge?: string }} card
 */
export async function renderOgCard({ eyebrow = "", title, meta = "", badge = "" }) {
  const heading = clip(title, 90);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: "64px 72px",
          borderLeft: `18px solid ${BURGUNDY}`,
          fontFamily: "Montserrat",
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {badge ? (
            <div
              style={{
                display: "flex",
                background: BURGUNDY,
                color: CREAM,
                fontSize: 26,
                fontWeight: 600,
                padding: "8px 20px",
                borderRadius: 999,
              }}
            >
              {badge}
            </div>
          ) : null}
          {eyebrow ? (
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: MUTED }}>{clip(eyebrow, 60)}</div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair",
            fontSize: heading.length > 55 ? 62 : 76,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {heading}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 28, color: MUTED, maxWidth: 820 }}>{clip(meta, 80)}</div>
          <div style={{ display: "flex", fontFamily: "Playfair", fontSize: 44, fontWeight: 700, color: BURGUNDY }}>
            E-Studenti
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() }
  );
}
