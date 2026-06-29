"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { authHeaders, getToken } from "../../lib/auth";
import { FACULTIES, MATERIAL_TYPES } from "../../lib/material-options";

const initialForm = {
  title: "",
  faculty: "",
  department: "",
  subject: "",
  teacher: "",
  type: "",
  file: null,
};

export default function NgarkoPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [titleTooltip, setTitleTooltip] = useState(false);

  const isPranues = form.type === "Provime Pranuese";

  useEffect(() => {
    if (!getToken()) router.push("/llogaria/hyr");
  }, [router]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!getToken()) {
      router.push("/llogaria/hyr");
      return;
    }
    setStatus("uploading");
    setError("");
    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(form)) {
        if (isPranues && ["department", "subject", "teacher"].includes(key)) {
          fd.append(key, "//");
        } else if (value) {
          fd.append(key, value);
        }
      }
      const res = await fetch(`${WORKER_URL}/?action=upload`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setStatus("success");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Ngarkimi dështoi.");
    }
  };

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-black text-srh-navy">
            Ngarko material
          </h1>
          <p className="mt-3 text-srh-navy/70">
            Materiali do të publikohet menjëherë në emrin tuaj.
          </p>
        </header>

        {status === "success" ? (
          <div className="rounded-2xl border border-srh-cream bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-srh-sage" />
            <h2 className="font-playfair text-3xl font-bold text-srh-navy">
              Materiali u ngarkua me sukses!
            </h2>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/materialet"
                className="rounded-xl bg-srh-crimson px-6 py-3 font-bold text-white hover:bg-[#5e1621]"
              >
                Shiko materialet
              </Link>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="rounded-xl border-2 border-srh-navy px-6 py-3 font-bold text-srh-navy hover:bg-srh-navy hover:text-white"
              >
                Ngarko tjetër
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-srh-cream bg-white p-6 md:p-8 shadow-sm"
          >
            <div className="rounded-xl border border-srh-cream bg-srh-cream/60 p-4 text-sm text-srh-navy/75">
              <p>Lejohen: PDF, Word (doc/docx), PowerPoint (ppt/pptx), Excel (xls/xlsx), ZIP</p>
              <p>Madhësia maksimale: 50MB</p>
              <p>Skedarët skanohen automatikisht para ngarkimit.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Title — always visible; tooltip shown for Provime Pranuese */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-srh-navy">
                  Titulli i materialit
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
                  <option value="">
                    {isPranues ? "Zgjidh fakultetin" : "Zgjidhni"}
                  </option>
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

              <Field label="Lloji i materialit" required>
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

            <Field label="Skedari" required>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setField("file", e.dataTransfer.files?.[0] || null);
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-srh-cream bg-srh-paper px-5 py-10 text-center hover:border-srh-crimson"
              >
                <Upload className="mb-3 h-12 w-12 text-srh-crimson" />
                <span className="font-bold text-srh-navy">
                  {form.file ? form.file.name : "Klikoni ose tërhiqni skedarin këtu"}
                </span>
                <span className="mt-2 text-sm text-srh-navy/60">
                  .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .zip
                </span>
                <input
                  required
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                  className="hidden"
                  onChange={(e) => setField("file", e.target.files?.[0] || null)}
                />
              </label>
            </Field>

            {status === "uploading" && (
              <div className="h-2 overflow-hidden rounded-full bg-srh-cream">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-srh-crimson" />
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-srh-cream bg-srh-paper p-4 text-sm font-semibold text-srh-crimson">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "uploading"}
              className="w-full rounded-xl bg-srh-crimson py-4 text-lg font-bold text-white hover:bg-[#5e1621] disabled:opacity-60"
            >
              {status === "uploading" ? "Duke ngarkuar..." : "Ngarko materialin"}
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
