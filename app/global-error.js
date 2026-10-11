"use client";

/**
 * Last-resort boundary for errors in the root layout itself (error.js cannot
 * catch those). It replaces the whole document, so it carries its own <html>
 * and plain inline styles rather than relying on the app's CSS.
 */
export default function GlobalError({ reset }) {
  return (
    <html lang="sq">
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
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Diçka shkoi keq</h1>
          <p style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
            Faqja nuk u ngarkua dot. Provoni përsëri ose kthehuni në ballinë.
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
            Provo përsëri
          </button>{" "}
          <a href="/" style={{ color: "#8b3a3a", fontWeight: 600 }}>
            Ballina
          </a>
        </main>
      </body>
    </html>
  );
}
