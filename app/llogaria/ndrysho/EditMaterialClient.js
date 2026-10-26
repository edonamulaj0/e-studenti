"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser } from "../../lib/auth";
import { DEFAULT_UNIVERSITY, MATERIAL_TYPES, facultiesFor } from "../../lib/material-options";
import { UNIVERSITIES } from "../../lib/placement";
import { useT } from "../../components/Preferences";
import SubjectInput from "../../components/SubjectInput";
import { translateMessage } from "../../lib/bulk-upload";

const emptyForm = {
  title: "",
  university: DEFAULT_UNIVERSITY,
  faculty: "",
  department: "",
  subject: "",
  teacher: "",
  type: "",
};

export default function EditMaterialClient({ id }) {
  const router = useRouter();
  const t = useT();
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
          university: material.university || DEFAULT_UNIVERSITY,
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
    <div className="bg-srh-paper px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-black text-srh-navy">
            {t("Ndrysho materialin")}
          </h1>
          <p className="mt-3 text-srh-navy/70">
            {t("Skedari nuk mund të ndryshohet, vetëm metadatat.")}
          </p>
        </header>

        {loading ? (
          <div className="h-80 animate-pulse rounded-2xl bg-srh-cream" />
        ) : (
          <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-srh-cream bg-surface p-6 md:p-8 shadow-sm"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* Title — always visible; tooltip shown for Provime Pranuese */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-srh-navy">
                  {t("Titulli")}
                  <span className="text-srh-crimson"> *</span>
                  {isPranues && (
                    <span className="relative">
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-srh-navy/15 text-[10px] font-bold text-srh-navy/70 hover:bg-srh-navy/25 focus:outline-hidden"
                        onMouseEnter={() => setTitleTooltip(true)}
                        onMouseLeave={() => setTitleTooltip(false)}
                        onFocus={() => setTitleTooltip(true)}
                        onBlur={() => setTitleTooltip(false)}
                        onClick={() => setTitleTooltip((v) => !v)}
                        aria-label={t("Ndihmë")}
                      >
                        ?
                      </button>
                      {titleTooltip && (
                        <span
                          role="tooltip"
                          className="absolute left-0 top-6 z-30 w-80 rounded-xl border border-srh-cream bg-surface p-3 text-xs font-normal leading-relaxed text-srh-navy/75 shadow-lg"
                        >
                          {t("Shkruaj emrin e departamentit dhe llojin e materialit.")}{" "}
                          {t("Shembuj:")} &quot;{t("Stomatologji - Provimi pranues 2024")}&quot;,{" "}
                          &quot;{t("Matematikë - Libër përgatitor")}&quot;,{" "}
                          &quot;{t("Informatikë - Teste të vjetra")}&quot;
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

              <Field label="Universiteti" required>
                <select
                  required
                  value={form.university}
                  onChange={(e) => setForm((current) => ({ ...current, university: e.target.value, faculty: "" }))}
                  className="input-srh"
                >
                  {UNIVERSITIES.map((university) => (
                    <option key={university.slug} value={university.slug}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Faculty (University of Prishtina) or study field — always visible */}
              <Field label={form.university === DEFAULT_UNIVERSITY ? "Fakulteti" : "Fusha e studimit"} required>
                <select
                  required
                  value={form.faculty}
                  onChange={(e) => setField("faculty", e.target.value)}
                  className="input-srh"
                >
                  <option value="">{t("Zgjidhni")}</option>
                  {facultiesFor(form.university).map((faculty) => (
                    <option key={faculty.code} value={faculty.code}>
                      {t(faculty.name)}
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
                  <SubjectInput
                    required
                    value={form.subject}
                    onChange={(value) => setField("subject", value)}
                    university={form.university}
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
                  <option value="">{t("Zgjidhni")}</option>
                  {MATERIAL_TYPES.map((type) => (
                    <option key={type} value={type}>{t(type)}</option>
                  ))}
                </select>
              </Field>
            </div>
            {error && (
              <p className="rounded-xl border border-srh-cream bg-srh-paper p-4 text-sm font-semibold text-srh-crimson">
                {translateMessage(t, error)}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-srh-crimson py-4 text-lg font-bold text-white hover:bg-burgundy-700 disabled:opacity-60"
            >
              {saving ? t("Duke ruajtur...") : t("Ruaj ndryshimet")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  const t = useT();
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-srh-navy">
        {t(label)}
        {required && <span className="text-srh-crimson"> *</span>}
      </span>
      {children}
    </label>
  );
}
