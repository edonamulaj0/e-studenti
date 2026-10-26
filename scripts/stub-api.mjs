#!/usr/bin/env node
/**
 * A tiny fake of the public API, so the website can be built and browsed with no
 * Worker, database or internet (`npm run stub-api`, then in another terminal
 * `NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8799 npm run build`). CI uses it too.
 * It answers only the read-only calls the build needs; everything else is `{}`.
 * `STUB_EMPTY=1` serves an empty catalogue. scripts/serve-static.mjs imports
 * `handleStubApi` to answer /api/ itself, for the browser tests.
 */
import http from "node:http";
import { pathToFileURL } from "node:url";

const PORT = Number(process.env.PORT) || 8799;

const materials = process.env.STUB_EMPTY ? [] : [
  {
    id: 1, title: "Anatomia 1", slug: "anatomia-1-med", faculty: "MED", subject: "Anatomi",
    type: "Ligjerata", teacher: "//", department: "//", study_level: "bachelor", file_type: "pdf",
    r2_url: "https://media.e-studenti.com/materials/example/anatomia.pdf",
    is_anonymous: 0, uploader_name: "Ana Beri", view_count: 3, download_count: 1,
  },
  {
    id: 2, title: "Algoritme", slug: "algoritme-fiek", faculty: "FIEK", subject: "Algoritme",
    type: "Afat", teacher: "//", department: "//", study_level: "bachelor", file_type: "docx",
    r2_url: "https://media.e-studenti.com/materials/example/algoritme.docx",
    is_anonymous: 1, view_count: 0, download_count: 0,
  },
];

const page = (items) => ({
  pagination: { page: 1, limit: 100, total: items.length, totalPages: 1, hasNextPage: false },
});

/** @param {import("node:http").IncomingMessage} req @param {import("node:http").ServerResponse} res */
export function handleStubApi(req, res) {
  const url = new URL(req.url, "http://localhost");
  const action = url.searchParams.get("action") || "materials";
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (action === "materials") {
    // Enough filtering for the browser tests: a search can come back empty.
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const faculty = (url.searchParams.get("faculty") || "").toUpperCase();
    const found = materials.filter(
      (m) =>
        (!q || `${m.title} ${m.subject} ${m.type}`.toLowerCase().includes(q)) &&
        (!faculty || m.faculty === faculty)
    );
    return res.end(JSON.stringify({ materials: found, entries: [], typeCounts: { Ligjerata: 1, Afat: 1 }, ...page(found) }));
  }
  if (action === "material-public") {
    const found = materials.find((m) => m.slug === url.searchParams.get("slug"));
    res.statusCode = found ? 200 : 404;
    return res.end(JSON.stringify(found ? { material: found } : { error: "Materiali nuk u gjet." }));
  }
  if (action === "subjects" || action === "subject-public") {
    const groups = [...new Set(materials.map((m) => `${m.subject.toLowerCase()}-${m.faculty.toLowerCase()}`))].map((slug) => {
      const rows = materials.filter((m) => `${m.subject.toLowerCase()}-${m.faculty.toLowerCase()}` === slug);
      return { slug, faculty: rows[0].faculty, name: rows[0].subject, count: rows.length, teachers: [], types: {} };
    });
    if (action === "subjects") return res.end(JSON.stringify({ subjects: groups }));
    const group = groups.find((g) => g.slug === url.searchParams.get("slug"));
    res.statusCode = group ? 200 : 404;
    return res.end(JSON.stringify(group
      ? { subject: group, materials: materials.filter((m) => m.subject === group.name && m.faculty === group.faculty) }
      : { error: "Lënda nuk u gjet." }));
  }
  if (action === "resource-links") return res.end(JSON.stringify({ links: [], ...page([]) }));
  if (action === "material-rating") return res.end(JSON.stringify({ helpful: 2, unhelpful: 0, mine: null }));
  if (action === "me") return res.end(JSON.stringify({ user: null }));
  if (action === "requests") return res.end(JSON.stringify({ requests: [], pagination: { page: 1, total: 0, hasNextPage: false } }));
  res.end("{}");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  http.createServer(handleStubApi).listen(PORT, "127.0.0.1", () => {
    console.log(`stub API on http://127.0.0.1:${PORT}  (NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:${PORT})`);
  });
}
