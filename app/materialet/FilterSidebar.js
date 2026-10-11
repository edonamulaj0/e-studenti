"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { FACULTIES, FIELDS, MATERIAL_TYPES, facultiesFor } from "../lib/material-options";
import { UNIVERSITIES, universityShort } from "../lib/placement";
import { STUDY_LEVELS } from "../lib/study-levels";
import { useT } from "../components/Preferences";

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

/** Draft filters are edited freely and only take effect on "Apliko filtrat". */
export default function FilterSidebar({ draft, setDraft, subjects, onApply, onClear, id }) {
  const t = useT();
  const [subjectQuery, setSubjectQuery] = useState("");
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  // The faculty list follows the university: UP has faculties, every other institution study fields.
  const university = draft.universities[0];
  const facultyOptions = (university ? facultiesFor(university) : [...FACULTIES, ...FIELDS]).map((f) => ({
    value: f.code,
    label: f.name,
    sub: university ? undefined : FACULTIES.includes(f) ? "UP" : "Fushë studimi",
  }));
  const setUniversity = (next) =>
    setDraft((d) => {
      const allowed = new Set((next[0] ? facultiesFor(next[0]) : [...FACULTIES, ...FIELDS]).map((f) => f.code));
      return { ...d, universities: next, faculties: d.faculties.filter((code) => allowed.has(code)), subjects: [] };
    });

  const subjectOptions = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    const picked = new Set(draft.subjects);
    return subjects
      .filter(
        (s) =>
          picked.has(s.slug) ||
          ((draft.universities.length === 0 || draft.universities.includes(s.university)) &&
            (draft.faculties.length === 0 || draft.faculties.includes(s.faculty)) &&
            (!q || s.name.toLowerCase().includes(q)))
      )
      .sort((a, b) => a.name.localeCompare(b.name, "sq"))
      .slice(0, 80)
      .map((s) => ({ value: s.slug, label: s.name, sub: `${universityShort(s.university)} · ${t(FACULTY_BY_CODE[s.faculty] || s.faculty)}` }));
  }, [subjects, subjectQuery, draft.subjects, draft.faculties, draft.universities, t]);

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
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
          options={UNIVERSITIES.map((u) => ({ value: u.slug, label: u.short, sub: u.name.includes(u.short) ? undefined : u.name }))}
          selected={draft.universities}
          onChange={setUniversity}
        />
        <Section
          title="Niveli"
          name={`${id}-level`}
          single
          defaultOpen
          options={STUDY_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
          selected={draft.levels}
          onChange={set("levels")}
        />
        <Section
          title="Fakulteti / fusha"
          name={`${id}-faculty`}
          single
          options={facultyOptions}
          selected={draft.faculties}
          onChange={set("faculties")}
        />
        <Section
          title="Lloji"
          name={`${id}-type`}
          single
          options={MATERIAL_TYPES.map((t) => ({ value: t, label: t }))}
          selected={draft.types}
          onChange={set("types")}
        />
        <Section
          title="Lënda"
          name={`${id}-subject`}
          defaultOpen
          options={subjectOptions}
          selected={draft.subjects}
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
        </Section>
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-200 pt-3">
        <button type="submit" className="btn-primary min-h-[44px] flex-1 px-4 py-2 text-sm">
          {t("Apliko filtrat")}
        </button>
        <button type="button" onClick={onClear} className="btn-outline min-h-[44px] px-4 py-2 text-sm">
          {t("Pastro")}
        </button>
      </div>
    </form>
  );
}

const FACULTY_BY_CODE = Object.fromEntries([...FACULTIES, ...FIELDS].map((f) => [f.code, f.name]));
