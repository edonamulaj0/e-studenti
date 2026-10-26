"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { FACULTIES, FIELDS, MATERIAL_TYPES, facultiesFor } from "../lib/material-options";
import { UNIVERSITIES, universityShort } from "../lib/placement";
import { STUDY_LEVELS } from "../lib/study-levels";
import { useT } from "../components/Preferences";
import { matchesSearch } from "../lib/search-text";

export const EMPTY_FILTERS = { universities: [], levels: [], faculties: [], types: [], subjects: [] };

/**
 * One collapsible filter. Whatever is selected stays visible above the options,
 * with an × on the right, even while the section is collapsed.
 *
 * `single` renders bullets (radio buttons: one choice); otherwise checkboxes.
 */
function Section({ title: titleSq, name, options, selected, onChange, single = false, defaultOpen = false, children }) {
  const t = useT();
  const title = t(titleSq);
  const [open, setOpen] = useState(defaultOpen);
  const picked = options.filter((o) => selected.includes(o.value));
  const rest = options.filter((o) => !selected.includes(o.value));
  const panelId = `filter-${name}`;

  const choose = (value) => onChange(single ? [value] : [...selected, value]);
  const remove = (value) => onChange(selected.filter((v) => v !== value));

  return (
    <div className="border-b border-gray-100 pb-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between py-1.5 text-left text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-navy-900"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {picked.length > 0 && (
        <ul className="mb-1 space-y-1" aria-label={t("{title}: të zgjedhura", { title })}>
          {picked.map((o) => (
            <li
              key={o.value}
              className="flex items-center justify-between gap-2 rounded-lg bg-burgundy-50 px-2.5 py-1.5 text-sm font-semibold text-burgundy-600"
            >
              <span className="min-w-0">
                {t(o.label)}
                {o.sub && <span className="block text-xs font-normal text-gray-600">{t(o.sub)}</span>}
              </span>
              <button
                type="button"
                onClick={() => remove(o.value)}
                aria-label={t("Hiq {label}", { label: t(o.label) })}
                className="shrink-0 rounded-md p-1 hover:bg-burgundy-600 hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div id={panelId} hidden={!open}>
        {children}
        <div role={single ? "radiogroup" : "group"} aria-label={title} className="max-h-60 overflow-y-auto pr-1">
          {rest.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-navy-900 hover:bg-navy-100/50"
            >
              <input
                type={single ? "radio" : "checkbox"}
                name={name}
                checked={false}
                onChange={() => choose(o.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-burgundy-600"
              />
              <span className="min-w-0 flex-1">
                {t(o.label)}
                {o.sub && <span className="block text-xs text-gray-600">{t(o.sub)}</span>}
              </span>
            </label>
          ))}
          {rest.length === 0 && picked.length === 0 && (
            <p className="px-1.5 py-2 text-sm text-gray-600">{t("Asnjë opsion.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const FACULTY_BY_CODE = Object.fromEntries([...FACULTIES, ...FIELDS].map((f) => [f.code, f.name]));

/**
 * The active filters as removable chips, in the order the sidebar lists them.
 * @returns {{ key: string, value: string, label: string }[]}
 */
export function activeFilterChips(filters, subjects) {
  const subjectName = new Map(subjects.map((s) => [s.slug, s.name]));
  return [
    ...filters.universities.map((v) => ({ key: "universities", value: v, label: universityShort(v) })),
    ...filters.levels.map((v) => ({ key: "levels", value: v, label: STUDY_LEVELS.find((l) => l.value === v)?.label || v })),
    ...filters.faculties.map((v) => ({ key: "faculties", value: v, label: FACULTY_BY_CODE[v] || v })),
    ...filters.types.map((v) => ({ key: "types", value: v, label: v })),
    ...filters.subjects.map((v) => ({ key: "subjects", value: v, label: subjectName.get(v) || v })),
  ];
}

/**
 * Filters apply as they are picked. Each list narrows to what can still match
 * the others, in both directions: a university narrows faculties and subjects,
 * and a faculty or subject narrows the universities that offer it.
 *
 * `onDone` (the phone drawer) adds a button that closes the drawer and says how
 * many materials match. `publicOnly` lists just the public universities.
 */
export default function FilterSidebar({ filters, onChange, subjects, onClear, onDone, resultCount, id, sections, publicOnly = false }) {
  const t = useT();
  const [subjectQuery, setSubjectQuery] = useState("");
  const show = (name) => !sections || sections.includes(name);
  const set = (key) => (value) => onChange({ ...filters, [key]: value });

  const pickedSubjects = subjects.filter((s) => filters.subjects.includes(s.slug));
  const universities = (publicOnly ? UNIVERSITIES.filter((u) => u.sector === "public") : UNIVERSITIES).filter(
    (u) =>
      filters.universities.includes(u.slug) ||
      ((filters.faculties.length === 0 || facultiesFor(u.slug).some((f) => filters.faculties.includes(f.code))) &&
        (pickedSubjects.length === 0 || pickedSubjects.some((s) => s.university === u.slug)))
  );

  // The faculty list follows the university: UP has faculties, every other institution study fields.
  const university = filters.universities[0];
  const facultyOptions = (university ? facultiesFor(university) : [...FACULTIES, ...FIELDS])
    .filter(
      (f) =>
        filters.faculties.includes(f.code) ||
        pickedSubjects.length === 0 ||
        pickedSubjects.some((s) => s.faculty === f.code)
    )
    .map((f) => ({
      value: f.code,
      label: f.name,
      sub: university ? undefined : FACULTIES.includes(f) ? "UP" : "Fushë studimi",
    }));
  const setUniversity = (next) => {
    const allowed = new Set((next[0] ? facultiesFor(next[0]) : [...FACULTIES, ...FIELDS]).map((f) => f.code));
    onChange({
      ...filters,
      universities: next,
      faculties: filters.faculties.filter((code) => allowed.has(code)),
      subjects: filters.subjects.filter((slug) => !next[0] || subjects.find((s) => s.slug === slug)?.university === next[0]),
    });
  };
  const setFaculty = (next) =>
    onChange({
      ...filters,
      faculties: next,
      subjects: filters.subjects.filter((slug) => !next[0] || subjects.find((s) => s.slug === slug)?.faculty === next[0]),
    });

  const subjectOptions = useMemo(() => {
    const picked = new Set(filters.subjects);
    return subjects
      .filter(
        (s) =>
          picked.has(s.slug) ||
          ((filters.universities.length === 0 || filters.universities.includes(s.university)) &&
            (filters.faculties.length === 0 || filters.faculties.includes(s.faculty)) &&
            matchesSearch(subjectQuery, s.name))
      )
      .sort((a, b) => a.name.localeCompare(b.name, "sq"))
      .slice(0, 80)
      .map((s) => ({ value: s.slug, label: s.name, sub: `${universityShort(s.university)} · ${t(FACULTY_BY_CODE[s.faculty] || s.faculty)}` }));
  }, [subjects, subjectQuery, filters.subjects, filters.faculties, filters.universities, t]);
  const active = activeFilterChips(filters, subjects).length > 0;

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        onDone?.();
      }}
      className="flex min-h-0 flex-1 flex-col"
      aria-label={t("Filtrat")}
    >
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        <Section
          title="Universiteti"
          name={`${id}-university`}
          single
          defaultOpen
          options={universities.map((u) => ({ value: u.slug, label: u.short, sub: u.name.includes(u.short) ? undefined : u.name }))}
          selected={filters.universities}
          onChange={setUniversity}
        />
        <Section
          title="Niveli"
          name={`${id}-level`}
          single
          defaultOpen
          options={STUDY_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
          selected={filters.levels}
          onChange={set("levels")}
        />
        {show("faculty") && <Section
          title="Fakulteti / fusha"
          name={`${id}-faculty`}
          single
          options={facultyOptions}
          selected={filters.faculties}
          onChange={setFaculty}
        />}
        {show("type") && <Section
          title="Lloji"
          name={`${id}-type`}
          single
          options={MATERIAL_TYPES.map((t) => ({ value: t, label: t }))}
          selected={filters.types}
          onChange={set("types")}
        />}
        {show("subject") && <Section
          title="Lënda"
          name={`${id}-subject`}
          defaultOpen
          options={subjectOptions}
          selected={filters.subjects}
          onChange={set("subjects")}
        >
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" aria-hidden />
            <input
              type="text"
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder={t("Kërko lëndë…")}
              aria-label={t("Kërko në lëndë")}
              className="input-srh min-h-[38px] w-full pl-8 text-sm"
            />
          </div>
        </Section>}
      </div>

      {(onDone || active) && (
        <div className="mt-4 flex gap-2 border-t border-gray-200 pt-3">
          {onDone && (
            <button type="submit" className="btn-primary min-h-[44px] flex-1 px-4 py-2 text-sm">
              {resultCount == null ? t("Shiko materialet") : t("Shiko {n} materiale", { n: resultCount })}
            </button>
          )}
          {active && (
            <button type="button" onClick={onClear} className={`btn-outline min-h-[44px] px-4 py-2 text-sm ${onDone ? "" : "flex-1"}`}>
              {t("Pastro")}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
