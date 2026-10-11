import { facultySlug, slugify } from "./material-slug.mjs";
import { DEFAULT_UNIVERSITY, universityTag } from "./placement.mjs";

/**
 * Subjects ("Lënda") are typed by hand on upload, so the same course arrives
 * spelled many ways. A subject is identified by its *key* — the name folded to
 * lowercase letters and digits — which already merges differences in case,
 * accents, spacing and punctuation. Anything beyond that (a typo, an abbreviation)
 * is merged by the moderator, which rewrites the stored name.
 */

/** Largest subject name accepted. */
export const MAX_SUBJECT_LENGTH = 200;

/** A subject as typed: trimmed, inner whitespace collapsed. */
export function normalizeSubjectName(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** "//" is how entrance-exam materials mark "no subject". */
export function isRealSubject(value) {
  const name = normalizeSubjectName(value);
  return name !== "" && name !== "//";
}

/** Spelling-insensitive identity of a subject. */
export function subjectKey(value) {
  return slugify(normalizeSubjectName(value));
}

/**
 * URL slug of a subject page: the key plus the faculty, e.g. "anatomi-med". Other
 * universities than the default add their own tag, e.g. "algoritme-inf-ubt".
 */
export function subjectSlug(faculty, subject, university) {
  const tag = universityTag(university);
  return `${subjectKey(subject)}-${facultySlug(faculty)}${tag ? `-${tag}` : ""}`;
}

/** Order in which material types appear on a subject page: exams first. */
export const SUBJECT_TYPE_ORDER = ["Afat", "Provime Pranuese", "Ligjerata", "Projekt", "Libër", "Të tjera"];

export function typeRank(type) {
  const index = SUBJECT_TYPE_ORDER.indexOf(type);
  return index === -1 ? SUBJECT_TYPE_ORDER.length : index;
}

/**
 * Groups material rows into subjects.
 * @param {{ id?: number, university?: string, faculty: string, subject: string, type?: string, teacher?: string, created_at?: string }[]} rows
 * @returns {{ slug: string, university: string, faculty: string, key: string, name: string, count: number,
 *             variants: { name: string, count: number }[], teachers: string[],
 *             types: Record<string, number>, ids: number[] }[]}
 */
export function groupSubjects(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!isRealSubject(row.subject)) continue;
    const key = subjectKey(row.subject);
    if (!key) continue;
    const faculty = String(row.faculty || "").toUpperCase();
    const university = row.university || DEFAULT_UNIVERSITY;
    const id = `${university}|${faculty}|${key}`;
    let group = groups.get(id);
    if (!group) {
      group = {
        slug: subjectSlug(faculty, row.subject, university),
        university,
        faculty,
        key,
        name: "",
        count: 0,
        variants: new Map(),
        teachers: new Set(),
        types: {},
        ids: [],
      };
      groups.set(id, group);
    }
    group.count += 1;
    if (row.id != null) group.ids.push(row.id);
    const spelling = normalizeSubjectName(row.subject);
    group.variants.set(spelling, (group.variants.get(spelling) || 0) + 1);
    const teacher = normalizeSubjectName(row.teacher);
    if (teacher && teacher !== "//") group.teachers.add(teacher);
    if (row.type) group.types[row.type] = (group.types[row.type] || 0) + 1;
  }

  return [...groups.values()]
    .map((group) => {
      const variants = [...group.variants.entries()]
        .map(([name, count]) => ({ name, count }))
        // The most used spelling is the display name; ties go to the one with
        // proper capitalisation (more upper-case letters), then alphabetically.
        .sort(
          (a, b) =>
            b.count - a.count ||
            (b.name.match(/\p{Lu}/gu) || []).length - (a.name.match(/\p{Lu}/gu) || []).length ||
            a.name.localeCompare(b.name, "sq")
        );
      return {
        slug: group.slug,
        university: group.university,
        faculty: group.faculty,
        key: group.key,
        name: variants[0].name,
        count: group.count,
        variants,
        teachers: [...group.teachers].sort((a, b) => a.localeCompare(b, "sq")),
        types: group.types,
        ids: group.ids,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "sq"));
}
