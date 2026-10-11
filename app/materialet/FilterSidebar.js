"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FACULTIES, MATERIAL_TYPES } from "../lib/material-options";
import { STUDY_LEVELS } from "../lib/study-levels";

export const EMPTY_FILTERS = { levels: [], faculties: [], types: [], subjects: [] };

const toggle = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

function CheckGroup({ legend, options, selected, onToggle, scroll = false }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs font-bold uppercase tracking-widest text-gray-600">{legend}</legend>
      <div className={scroll ? "max-h-52 overflow-y-auto pr-1" : ""}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-navy-900 hover:bg-navy-100/50"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="h-4 w-4 shrink-0 accent-burgundy-600"
            />
            <span className="min-w-0 flex-1 truncate" title={option.title}>
              {option.label}
              {option.sub && <span className="ml-1.5 text-gray-600">{option.sub}</span>}
            </span>
            {option.hint && <span className="shrink-0 text-xs text-gray-600">{option.hint}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Draft filters are edited freely and only take effect on "Apliko filtrat". */
export default function FilterSidebar({ draft, setDraft, subjects, onApply, onClear, id }) {
  const [subjectQuery, setSubjectQuery] = useState("");

  const subjectOptions = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    const picked = new Set(draft.subjects);
    const visible = subjects.filter(
      (s) =>
        picked.has(s.slug) ||
        ((draft.faculties.length === 0 || draft.faculties.includes(s.faculty)) &&
          (!q || s.name.toLowerCase().includes(q)))
    );
    return visible
      .sort(
        (a, b) =>
          Number(picked.has(b.slug)) - Number(picked.has(a.slug)) ||
          a.name.localeCompare(b.name, "sq")
      )
      .slice(0, 80)
      .map((s) => ({ value: s.slug, label: s.name, hint: s.faculty, title: `${s.name} — ${s.faculty}` }));
  }, [subjects, subjectQuery, draft.subjects, draft.faculties]);

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: toggle(d[key], value) }));

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
      className="flex max-h-full flex-col"
      aria-label="Filtrat"
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        <CheckGroup
          legend="Niveli"
          options={STUDY_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
          selected={draft.levels}
          onToggle={set("levels")}
        />
        <CheckGroup
          legend="Fakulteti"
          options={FACULTIES.map((f) => ({
            value: f.code,
            label: f.code,
            sub: f.name.replace(/^Fakulteti (i |e )?/, ""),
            title: f.name,
          }))}
          selected={draft.faculties}
          onToggle={set("faculties")}
          scroll
        />
        <CheckGroup
          legend="Lloji"
          options={MATERIAL_TYPES.map((t) => ({ value: t, label: t }))}
          selected={draft.types}
          onToggle={set("types")}
        />
        <div>
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" aria-hidden />
            <input
              type="text"
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder="Kërko lëndë…"
              aria-label="Kërko në lëndë"
              className="input-srh min-h-[38px] w-full pl-8 text-sm"
            />
          </div>
          {subjectOptions.length === 0 ? (
            <p className="px-1.5 py-2 text-sm text-gray-600">Asnjë lëndë.</p>
          ) : (
            <CheckGroup
              legend="Lënda"
              options={subjectOptions}
              selected={draft.subjects}
              onToggle={set("subjects")}
              scroll
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-200 pt-3">
        <button type="submit" className="btn-primary min-h-[44px] flex-1 px-4 py-2 text-sm">
          Apliko filtrat
        </button>
        <button type="button" onClick={onClear} className="btn-outline min-h-[44px] px-4 py-2 text-sm">
          Pastro
        </button>
      </div>
    </form>
  );
}
