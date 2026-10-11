import { WORKER_URL } from "./worker-url";
import { normalizeSubjectName } from "./subjects";

/**
 * Subject names offered while someone types one on upload: the subjects that already carry
 * materials (so uploads land in the same subject page) and every course name from the
 * programme study plans we collected (so a subject nobody uploaded yet can still be picked).
 */

export const fold = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Placeholder rows in the study plans ("Lëndë zgjedhore I") are not subjects. */
const PLACEHOLDER = /^(l[eë]nd[eë] zgjedhore|elective|zgjedhore)\b/i;

let catalogPromise;
/** Course names by university slug, each folded-key unique. Loaded on demand (the data file is large). */
export function loadCourseCatalog() {
  catalogPromise ||= import("../data/courses.json").then((m) => {
    const byUniversity = new Map();
    for (const [programmeId, entry] of Object.entries(m.default || m)) {
      const university = programmeId.split("/")[0];
      if (!byUniversity.has(university)) byUniversity.set(university, new Map());
      const names = byUniversity.get(university);
      for (const course of entry.courses) {
        const name = normalizeSubjectName(course[2]);
        const key = fold(name);
        if (key && !PLACEHOLDER.test(name) && !names.has(key)) names.set(key, name);
      }
    }
    return byUniversity;
  });
  return catalogPromise;
}

let existingPromise;
/** Subjects that already have materials: [{ name, university, faculty }]. */
export function loadExistingSubjects() {
  existingPromise ||= fetch(`${WORKER_URL}/?action=subjects`)
    .then((res) => (res.ok ? res.json() : { subjects: [] }))
    .then((data) => data.subjects || [])
    .catch(() => {
      existingPromise = undefined;
      return [];
    });
  return existingPromise;
}

/**
 * Up to `limit` names matching `query`: names that start with it first, then names containing
 * every typed word. `existing` entries outrank catalogue entries of the same name.
 */
export function matchSubjects({ query, university, existing, catalog, limit = 8 }) {
  const q = fold(query);
  if (!q) return [];
  const words = q.split(" ");
  const seen = new Set();
  const found = [];
  const consider = (name, source) => {
    const key = fold(name);
    if (seen.has(key)) return;
    if (!words.every((w) => key.includes(w))) return;
    seen.add(key);
    found.push({ name, source, rank: key.startsWith(q) ? 0 : 1 });
  };
  for (const s of existing) if (!university || s.university === university) consider(s.name, "existing");
  const names = catalog?.get(university);
  if (names) for (const name of names.values()) consider(name, "plan");
  found.sort((a, b) => a.rank - b.rank || a.name.length - b.name.length);
  return found.slice(0, limit);
}
