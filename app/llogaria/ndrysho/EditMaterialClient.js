"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser } from "../../lib/auth";
import { FACULTIES, MATERIAL_TYPES } from "../../lib/material-options";

const emptyForm = {
  title: "",
  faculty: "",
  department: "",
  subject: "",
  teacher: "",
  type: "",
};

export default function EditMaterialClient({ id }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") === "moderim" ? "/llogaria/moderim?tab=materialet" : "/llogaria/materiale-e-mia";
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [titleTooltip, setTitleTooltip] = useState(false);

  const isPranues = form.type === "Provime Pranuese";

  useEffect(() => {
    async function loadMaterial() {
      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        router.push("/llogaria/hyr");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${WORKER_URL}/?action=material&id=${id}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Materiali nuk u gjet.");
        const material = data.material;
        setForm({
          title: material.title || "",
          faculty: material.faculty || "",
          department: material.department || "",
          subject: material.subject || "",
          teacher: material.teacher || "",
          type: material.type || "",
        });
      } catch (err) {
        setError(err.message || "Materiali nuk u gjet.");
      } finally {
        setLoading(false);
      }
    }

    loadMaterial();
  }, [id, router]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const isCurrentlyPranues = form.type === "Provime Pranuese";
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (isCurrentlyPranues) {
        payload.department = "//";
        payload.subject = "//";
        payload.teacher = "//";
      }
      const res = await fetch(`${WORKER_URL}/?action=edit&id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ruajtja dështoi.");
      router.push(returnTo);
    } catch (err) {
      setError(err.message || "Ruajtja dështoi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-black text-srh-navy">
            Ndrysho materialin
          </h1>
          <p className="mt-3 text-srh-navy/70">
            Skedari nuk mund të ndryshohet, vetëm metadatat.
          </p>
        </header>

        {loading ? (
          <div className="h-80 animate-pulse rounded-2xl bg-srh-cream" />
        ) : (
          <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-srh-cream bg-white p-6 md:p-8 shadow-sm"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* Title — always visible; tooltip shown for Provime Pranuese */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-srh-navy">
                  Titulli
                  <span className="text-srh-crimson"> *</span>
                  {isPranues && (
                    <span className="relative">
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-srh-navy/15 text-[10px] font-bold text-srh-navy/60 hover:bg-srh-navy/25 focus:outline-none"
                        onMouseEnter={() => setTitleTooltip(true)}
                        onMouseLeave={() => setTitleTooltip(false)}
                        onFocus={() => setTitleTooltip(true)}
                        onBlur={() => setTitleTooltip(false)}
                        onClick={() => setTitleTooltip((v) => !v)}
                        aria-label="Ndihmë"
                      >
                        ?
                      </button>
                      {titleTooltip && (
                        <span
                          role="tooltip"
                          className="absolute left-0 top-6 z-30 w-80 rounded-xl border border-srh-cream bg-white p-3 text-xs font-normal leading-relaxed text-srh-navy/75 shadow-lg"
                        >
                          Shkruaj emrin e departamentit dhe llojin e materialit.
                          Shembuj: &quot;Stomatologji - Provimi pranues 2024&quot;,
                          &quot;Matematikë - Libër përgatitor&quot;,
                          &quot;Informatikë - Teste të vjetra&quot;
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className="input-srh"
                />
              </label>

              {/* Faculty — always visible */}
              <Field label="Fakulteti" required>
                <select
                  required
                  value={form.faculty}
                  onChange={(e) => setField("faculty", e.target.value)}
                  className="input-srh"
                >
                  <option value="">Zgjidhni</option>
                  {FACULTIES.map((faculty) => (
                    <option key={faculty.code} value={faculty.code}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Department — hidden for Provime Pranuese */}
              {!isPranues && (
                <Field label="Departamenti">
                  <input
                    value={form.department}
                    onChange={(e) => setField("department", e.target.value)}
                    placeholder="//"
                    className="input-srh"
                  />
                </Field>
              )}

              {/* Subject — hidden for Provime Pranuese */}
              {!isPranues && (
                <Field label="Lënda" required>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setField("subject", e.target.value)}
                    className="input-srh"
                  />
                </Field>
              )}

              {/* Teacher — hidden for Provime Pranuese */}
              {!isPranues && (
                <Field label="Profesori">
                  <input
                    value={form.teacher}
                    onChange={(e) => setField("teacher", e.target.value)}
                    placeholder="//"
                    className="input-srh"
                  />
                </Field>
              )}

              <Field label="Lloji" required>
                <select
                  required
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  className="input-srh"
                >
                  <option value="">Zgjidhni</option>
                  {MATERIAL_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>
            </div>
            {error && (
              <p className="rounded-xl border border-srh-cream bg-srh-paper p-4 text-sm font-semibold text-srh-crimson">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-srh-crimson py-4 text-lg font-bold text-white hover:bg-[#5e1621] disabled:opacity-60"
            >
              {saving ? "Duke ruajtur..." : "Ruaj ndryshimet"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-srh-navy">
        {label}
        {required && <span className="text-srh-crimson"> *</span>}
      </span>
      {children}
    </label>
  );
}
