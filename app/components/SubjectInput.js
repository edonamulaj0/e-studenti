"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { loadCourseCatalog, loadExistingSubjects, matchSubjects } from "../lib/subject-suggestions";
import { useT } from "./Preferences";

/**
 * Free-text subject field that lists matching subjects as you type; picking one fills the field.
 * Suggestions are scoped to `university`. Typing a name that is not listed is still fine.
 */
export default function SubjectInput({ value, onChange, university, className = "", ...rest }) {
  const t = useT();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [data, setData] = useState({ existing: [], catalog: null });

  useEffect(() => {
    if (!open || data.catalog) return;
    let cancelled = false;
    Promise.all([loadExistingSubjects(), loadCourseCatalog()]).then(([existing, catalog]) => {
      if (!cancelled) setData({ existing, catalog });
    });
    return () => {
      cancelled = true;
    };
  }, [open, data.catalog]);

  const matches = useMemo(
    () => matchSubjects({ query: value, university, existing: data.existing, catalog: data.catalog }),
    [value, university, data]
  );
  // An exact match is already chosen; no need to list it again.
  const visible = matches.filter((m) => m.name !== value);
  const showList = open && visible.length > 0;

  const choose = (name) => {
    onChange(name);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % visible.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? visible.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(visible[active].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        {...rest}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={className}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("Lëndët e sugjeruara")}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-surface p-1 shadow-lg"
        >
          {visible.map((m, i) => (
            <li
              key={m.name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: the input would blur and close the list before a click lands.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(m.name);
              }}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-navy-900 ${
                i === active ? "bg-burgundy-50" : "hover:bg-gray-100"
              }`}
            >
              <Tag className="h-3.5 w-3.5 shrink-0 text-burgundy-600" aria-hidden />
              <span className="min-w-0 truncate">{m.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
