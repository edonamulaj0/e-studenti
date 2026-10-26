import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  buildPublicSearchClause,
  foldSearchText,
  materialMatchesPublic,
  searchTerms,
} from "./material-privacy.js";
import { buildResourceSearchClause } from "./resource-links.js";

/** The generated SQL runs on a real SQLite engine, the one D1 is built on. */
function catalogue() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, surname TEXT);
    CREATE TABLE materials (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, subject TEXT,
      teacher TEXT, type TEXT, department TEXT, is_anonymous INTEGER DEFAULT 0);
    INSERT INTO users VALUES (1, 'Arbër', 'Krasniqi'), (2, 'Drita', 'Gashi');
    INSERT INTO materials VALUES
      (1, 1, 'Analizë e algoritmeve - kapitulli 3', 'Analiza e Algoritmeve', 'Prof. Çela', 'Ligjerata', '//', 0),
      (2, 2, 'Afatet e Elektronikës 2016-2026', 'Elektronika', '//', 'Afat', '//', 1),
      (3, 2, 'Testi pranues 2024', '//', '//', 'Provime Pranuese', '//', 0),
      (4, 1, 'Ushtrime 50% te zgjidhura', 'Fizika', '//', 'Të tjera', '//', 0);
  `);
  return (q) => {
    const { clause, params } = buildPublicSearchClause(q);
    const rows = db
      .prepare(`SELECT m.id FROM materials m LEFT JOIN users u ON m.user_id = u.id WHERE ${clause} ORDER BY m.id`)
      .all(...params);
    return rows.map((row) => row.id);
  };
}

describe("catalogue search", () => {
  const search = catalogue();

  it("ignores ë and ç in either the query or the stored text", () => {
    expect(search("analize")).toEqual([1]);
    expect(search("analizë")).toEqual([1]);
    expect(search("ANALIZË")).toEqual([1]);
    expect(search("cela")).toEqual([1]);
    expect(search("elektronikes")).toEqual([2]);
  });

  it("finds a material by its type", () => {
    expect(search("pranuese")).toEqual([3]);
    expect(search("ligjerata")).toEqual([1]);
  });

  it("needs every word to match", () => {
    expect(search("algoritmeve kapitulli")).toEqual([1]);
    expect(search("algoritmeve fizika")).toEqual([]);
  });

  it("searches uploader names only for named uploads", () => {
    expect(search("arber")).toEqual([1, 4]);
    expect(search("gashi")).toEqual([3]); // material 2 is anonymous
  });

  it("treats % as a literal character", () => {
    expect(search("50%")).toEqual([4]);
    expect(search("%")).toEqual([4]);
  });

  it("agrees with the in-memory matcher used for legacy rows", () => {
    const legacy = {
      title: "Analizë e algoritmeve",
      subject: "Analiza",
      type: "Provime Pranuese",
      uploader_name: "Arbër Krasniqi",
    };
    expect(materialMatchesPublic(legacy, { q: "analize pranuese" })).toBe(true);
    expect(materialMatchesPublic(legacy, { q: "arber" })).toBe(true);
    expect(materialMatchesPublic({ ...legacy, is_anonymous: 1 }, { q: "arber" })).toBe(false);
    expect(materialMatchesPublic(legacy, { q: "analize fizika" })).toBe(false);
  });
});

describe("resource link search", () => {
  it("folds accents too", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, surname TEXT);
      CREATE TABLE resource_links (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, description TEXT,
        subject TEXT, resolved_domain TEXT, is_anonymous INTEGER DEFAULT 0);
      INSERT INTO users VALUES (1, 'Arbër', 'Krasniqi');
      INSERT INTO resource_links VALUES (1, 1, 'Përmbledhje për provimin', 'Shënime nga ligjëratat', 'Matematikë', 'drive.google.com', 1);
    `);
    const { clause, params } = buildResourceSearchClause("permbledhje matematike");
    const sql = `SELECT r.id FROM resource_links r JOIN users u ON r.user_id = u.id WHERE ${clause}`;
    expect(db.prepare(sql).all(...params)).toHaveLength(1);
    const anonymous = buildResourceSearchClause("arber");
    expect(db.prepare(`SELECT r.id FROM resource_links r JOIN users u ON r.user_id = u.id WHERE ${anonymous.clause}`).all(...anonymous.params)).toHaveLength(0);
  });
});

describe("query words", () => {
  it("are folded, split and capped", () => {
    expect(foldSearchText("Përgatitje ÇELA")).toBe("pergatitje cela");
    expect(searchTerms("  a  b,c;d e f g ")).toEqual(["a", "b", "c", "d", "e"]);
    expect(searchTerms("   ")).toEqual([]);
  });
});

describe("browser-side filters", () => {
  it("fold text exactly like the Worker", async () => {
    const browser = await import("../../app/lib/search-text.js");
    for (const text of ["Analizë", "ÇELA", "Përmbledhje për provimin", "Škola Žurić"]) {
      expect(browser.foldSearchText(text)).toBe(foldSearchText(text));
    }
    expect(browser.matchesSearch("analize kapitulli", "Analizë e algoritmeve", "Kapitulli 3")).toBe(true);
    expect(browser.matchesSearch("analize fizika", "Analizë e algoritmeve")).toBe(false);
    expect(browser.matchesSearch("  ", "anything")).toBe(true);
  });
});
