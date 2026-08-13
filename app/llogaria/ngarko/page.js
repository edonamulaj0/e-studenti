"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser } from "../../lib/auth";
import { FACULTIES, MATERIAL_TYPES } from "../../lib/material-options";
import { STUDY_LEVELS } from "../../lib/study-levels";

const initialForm = {
  title: "",
  faculty: "",
  department: "",
  subject: "",
  teacher: "",
  type: "",
  study_level: "bachelor",
  file: null,
};

/** Must stay in sync with the worker's own limits (MAX_FILE_SIZE, ALLOWED_EXTENSIONS). */
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip"];
const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

const NETWORK_ERROR =
  "Lidhja me serverin u ndërpre gjatë ngarkimit. Kontrolloni internetin dhe provoni përsëri — skedarët e mëdhenj kërkojnë lidhje të qëndrueshme.";

function formatMegabytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "");
}

/** Local check so oversized or unsupported files fail instantly, before a doomed upload. */
function validateFile(file) {
  if (!file) return "Zgjidhni një skedar për ngarkim.";
  if (file.size === 0) return "Skedari është bosh.";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Lloji i skedarit nuk lejohet. Lejohen: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Skedari është ${formatMegabytes(file.size)}MB — madhësia maksimale është 50MB. Zvogëloni ose ndajeni skedarin.`;
  }
  return "";
}

function errorForStatus(status) {
  if (status === 401) return "Sesioni juaj ka skaduar. Hyni përsëri dhe provoni sërish.";
  if (status === 413) return "Skedari është shumë i madh. Madhësia maksimale është 50MB.";
  if (status === 429) return "Shumë ngarkime brenda pak kohe. Provoni përsëri më vonë.";
  if (status >= 500) return "Serveri nuk e përpunoi dot skedarin. Provoni përsëri.";
  return `Ngarkimi dështoi (kodi ${status}).`;
}

/**
 * XMLHttpRequest instead of fetch: it reports real upload progress, and it lets
 * transport failures be told apart from HTTP errors so a dropped connection does
 * not surface as the browser's bare "Failed to fetch".
 */
function uploadMaterial(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${WORKER_URL}/?action=upload`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Error pages from the edge are not JSON; errorForStatus covers them.
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }
      reject(new Error(data.error || errorForStatus(xhr.status)));
    };
    xhr.onerror = () => reject(new Error(NETWORK_ERROR));
    xhr.ontimeout = () => reject(new Error(NETWORK_ERROR));
    xhr.onabort = () => reject(new Error("Ngarkimi u ndërpre."));
    xhr.send(formData);
  });
}

export default function NgarkoPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [titleTooltip, setTitleTooltip] = useState(false);

  const isPranues = form.type === "Provime Pranuese";

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (!user) router.push("/llogaria/hyr");
    });
  }, [router]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectFile = (file) => {
    setField("file", file);
    setError(file ? validateFile(file) : "");
  };

  const submit = async (event) => {
    event.preventDefault();
    const fileError = validateFile(form.file);
    if (fileError) {
      setStatus("error");
      setError(fileError);
      return;
    }

    setStatus("uploading");
    setError("");
    setProgress(0);
    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(form)) {
        if (isPranues && ["department", "subject", "teacher"].includes(key)) {
          fd.append(key, "//");
        } else if (value) {
          fd.append(key, value);
        }
      }
      fd.append("is_anonymous", isAnonymous ? "1" : "0");
      await uploadMaterial(fd, setProgress);
      setStatus("success");
      setForm(initialForm);
      setIsAnonymous(false);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Ngarkimi dështoi.");
    } finally {
      setProgress(0);
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

              <Field label="Niveli i studimit" required>
                <select
                  required
                  value={form.study_level}
                  onChange={(e) => setField("study_level", e.target.value)}
                  className="input-srh"
                >
                  {STUDY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Skedari" required>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  selectFile(e.dataTransfer.files?.[0] || null);
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-srh-cream bg-srh-paper px-5 py-10 text-center hover:border-srh-crimson"
              >
                <Upload className="mb-3 h-12 w-12 text-srh-crimson" />
                <span className="font-bold text-srh-navy">
                  {form.file ? form.file.name : "Klikoni ose tërhiqni skedarin këtu"}
                </span>
                <span className="mt-2 text-sm text-srh-navy/60">
                  {form.file
                    ? `${formatMegabytes(form.file.size)}MB nga 50MB të lejuara`
                    : ACCEPT_ATTRIBUTE.replace(/,/g, ", ")}
                </span>
                <input
                  type="file"
                  accept={ACCEPT_ATTRIBUTE}
                  className="hidden"
                  onChange={(e) => selectFile(e.target.files?.[0] || null)}
                />
              </label>
            </Field>

            {status === "uploading" && (
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-srh-cream">
                  <div
                    className="h-full rounded-full bg-srh-crimson transition-all duration-200"
                    style={{ width: `${Math.max(3, Math.round(progress * 100))}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-sm text-srh-navy/60">
                  {progress < 1
                    ? `Duke ngarkuar... ${Math.round(progress * 100)}%`
                    : "Duke përpunuar skedarin..."}
                </p>
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-srh-cream bg-srh-paper p-4 text-sm font-semibold text-srh-crimson">
                {error}
              </p>
            )}
            <div className="rounded-xl border border-srh-cream bg-srh-cream/40 p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-srh-navy">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 accent-srh-crimson"
                />
                Publiko si anonim
              </label>
              <p className="mt-1.5 pl-7 text-xs text-srh-navy/60">
                Emri juaj nuk do të shfaqet publikisht, por mbetet i dukshëm për moderatorët në rast raportimi.
              </p>
            </div>
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
