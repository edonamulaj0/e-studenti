"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pause, Play, RotateCw, Trash2, Upload } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser } from "../../lib/auth";
import { FACULTIES, MATERIAL_TYPES } from "../../lib/material-options";
import { STUDY_LEVELS } from "../../lib/study-levels";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES_PER_BATCH,
  PRANUES,
  buildFormData,
  chunk,
  effectiveFields,
  findBatchDuplicates,
  formatMegabytes,
  inferMetadata,
  planUploads,
  sha256Hex,
  summarize,
  validateFile,
  validateRow,
} from "../../lib/bulk-upload";

const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");
/** Longest an automatic wait after a rate limit may be. */
const MAX_AUTO_WAIT_SECONDS = 15 * 60;

const NETWORK_ERROR =
  "Lidhja me serverin u ndërpre gjatë ngarkimit. Kontrolloni internetin dhe provoni përsëri.";

const initialDefaults = {
  faculty: "",
  department: "",
  subject: "",
  teacher: "",
  type: "",
  typeLocked: false,
  study_level: "bachelor",
  is_anonymous: false,
};

function errorForStatus(status) {
  if (status === 401) return "Sesioni juaj ka skaduar. Hyni përsëri dhe provoni sërish.";
  if (status === 413) return "Skedari është shumë i madh. Madhësia maksimale është 50MB.";
  if (status === 429) return "Shumë ngarkime brenda pak kohe. Provoni përsëri më vonë.";
  if (status >= 500) return "Serveri nuk e përpunoi dot skedarin. Provoni përsëri.";
  return `Ngarkimi dështoi (kodi ${status}).`;
}

/**
 * XMLHttpRequest rather than fetch: it reports real upload progress and tells a
 * dropped connection apart from an HTTP error. `register` receives the request
 * so the caller can abort it. The per-file client id makes a retry safe: if the
 * first attempt actually reached the server, the retry gets that row back.
 */
function sendUpload({ form, clientUploadId, onProgress, register }) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.open(
      "POST",
      `${WORKER_URL}/?action=upload&client_upload_id=${encodeURIComponent(clientUploadId)}`
    );
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
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };
    xhr.onerror = () => resolve({ ok: false, status: 0, data: {}, network: true });
    xhr.ontimeout = () => resolve({ ok: false, status: 0, data: {}, network: true });
    xhr.onabort = () => resolve({ ok: false, status: 0, data: {}, aborted: true });
    xhr.send(form);
  });
}

export default function NgarkoPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [defaults, setDefaults] = useState(initialDefaults);
  const [paused, setPaused] = useState(true);
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const requests = useRef(new Map());
  const resumeTimer = useRef(null);

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (!user) router.push("/llogaria/hyr");
    });
  }, [router]);

  const patchRow = useCallback((id, patch) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const summary = summarize(rows);

  // ── Intake ──────────────────────────────────────────────────────────────
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;
    const room = MAX_FILES_PER_BATCH - rowsRef.current.length;
    const accepted = incoming.slice(0, Math.max(0, room));
    if (accepted.length < incoming.length) {
      setNotice(`Mund të shtoni deri në ${MAX_FILES_PER_BATCH} skedarë njëherësh; u shtuan ${accepted.length}.`);
    } else {
      setNotice("");
    }
    setRows((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        clientUploadId: crypto.randomUUID(),
        file,
        status: "ready",
        progress: 0,
        error: "",
        inferred: inferMetadata(file.name),
        overrides: {},
        hash: "",
        hashing: false,
        hashFailed: false,
        checked: false,
        duplicate: null,
        keepDuplicate: false,
        resultStatus: "",
      })),
    ]);
  };

  // Hash files one at a time while the user fills in the form.
  useEffect(() => {
    if (rows.some((row) => row.hashing)) return;
    const next = rows.find(
      (row) => !row.hash && !row.hashFailed && row.status === "ready" && !validateFile(row.file)
    );
    if (!next) return;
    patchRow(next.id, { hashing: true });
    sha256Hex(next.file)
      .then((hash) => patchRow(next.id, { hash, hashing: false }))
      .catch(() => patchRow(next.id, { hashFailed: true, hashing: false }));
  }, [rows, patchRow]);

  // Ask the server which of the hashed files already exist. Hashes finish one
  // by one, so wait a moment and send what has accumulated as a single request.
  useEffect(() => {
    if (!rows.some((row) => row.hash && !row.checked)) return undefined;
    const timer = setTimeout(async () => {
      const pending = rowsRef.current.filter((row) => row.hash && !row.checked);
      if (pending.length === 0) return;
      const ids = new Set(pending.map((row) => row.id));
      setRows((current) => current.map((row) => (ids.has(row.id) ? { ...row, checked: true } : row)));
      for (const group of chunk(pending, 50)) {
        try {
          const res = await fetch(`${WORKER_URL}/?action=check-duplicates`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hashes: group.map((row) => row.hash) }),
          });
          if (!res.ok) continue;
          const { duplicates = [] } = await res.json();
          const byHash = new Map(duplicates.map((d) => [d.hash, d]));
          const inGroup = new Set(group.map((row) => row.id));
          setRows((current) =>
            current.map((row) =>
              inGroup.has(row.id) && byHash.has(row.hash) ? { ...row, duplicate: byHash.get(row.hash) } : row
            )
          );
        } catch {
          // The check is a courtesy; uploading still works without it.
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [rows]);

  const batchDuplicates = findBatchDuplicates(rows);
  const isDuplicate = (row) => Boolean(row.duplicate || batchDuplicates.has(row.id));

  // ── Queue ───────────────────────────────────────────────────────────────
  const finishRow = useCallback(
    (id, result) => {
      requests.current.delete(id);
      if (result.ok) {
        patchRow(id, { status: "done", progress: 1, error: "", resultStatus: result.data.status || "approved" });
        return;
      }
      if (result.aborted) {
        patchRow(id, { status: "failed", progress: 0, error: "Ngarkimi u anulua." });
        return;
      }
      if (result.status === 429 && result.data.code === "pending_limit") {
        // Not this file's fault: put it back and stop until some are reviewed.
        patchRow(id, { status: "queued", progress: 0, error: "" });
        setPaused(true);
        setNotice(result.data.error);
        return;
      }
      if (result.status === 429) {
        patchRow(id, { status: "queued", progress: 0, error: "" });
        setPaused(true);
        const wait = Math.min(Number(result.data.retryAfter) || 60, MAX_AUTO_WAIT_SECONDS);
        setNotice(`${result.data.error || errorForStatus(429)} Do të vazhdojë automatikisht pas ${Math.ceil(wait / 60)} min.`);
        clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => {
          setNotice("");
          setPaused(false);
        }, wait * 1000);
        return;
      }
      if (result.status === 401) {
        patchRow(id, { status: "failed", progress: 0, error: errorForStatus(401) });
        setPaused(true);
        setNotice(errorForStatus(401));
        return;
      }
      patchRow(id, {
        status: "failed",
        progress: 0,
        error: result.network ? NETWORK_ERROR : result.data.error || errorForStatus(result.status),
      });
    },
    [patchRow]
  );

  const startUpload = useCallback(
    async (id) => {
      const row = rowsRef.current.find((r) => r.id === id);
      if (!row || requests.current.has(id)) return;
      requests.current.set(id, null);
      patchRow(id, { status: "uploading", progress: 0, error: "" });
      const result = await sendUpload({
        form: buildFormData(row, defaultsRef.current, row.hash),
        clientUploadId: row.clientUploadId,
        onProgress: (fraction) => patchRow(id, { progress: fraction }),
        register: (xhr) => requests.current.set(id, xhr),
      });
      finishRow(id, result);
    },
    [patchRow, finishRow]
  );

  useEffect(() => {
    for (const id of planUploads(rows, { paused })) startUpload(id);
  }, [rows, paused, startUpload]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  // Leaving mid-upload would silently lose the rest of the batch.
  useEffect(() => {
    if (summary.active === 0) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [summary.active]);

  const startAll = () => {
    setAttempted(true);
    setNotice("");
    setRows((current) =>
      current.map((row) => {
        if (row.status !== "ready") return row;
        if (isDuplicate(row) && !row.keepDuplicate) return { ...row, status: "skipped" };
        if (Object.keys(validateRow(row, defaultsRef.current)).length > 0) return row;
        return { ...row, status: "queued" };
      })
    );
    setPaused(false);
  };

  const retryFailed = () => {
    setNotice("");
    setRows((current) =>
      current.map((row) => (row.status === "failed" ? { ...row, status: "queued", error: "" } : row))
    );
    setPaused(false);
  };

  const removeRow = (id) => {
    requests.current.get(id)?.abort();
    requests.current.delete(id);
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const cancelRow = (id) => requests.current.get(id)?.abort();

  const clearFinished = () =>
    setRows((current) => current.filter((row) => row.status !== "done" && row.status !== "skipped"));

  const setOverride = (id, field, value) =>
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, overrides: { ...row.overrides, [field]: value } } : row
      )
    );

  const setDefault = (field, value) => setDefaults((current) => ({ ...current, [field]: value }));

  const readyCount = rows.filter((row) => row.status === "ready").length;
  const allDone = summary.total > 0 && summary.done + summary.skipped === summary.total;
  const publishedCount = rows.filter((r) => r.status === "done" && r.resultStatus === "approved").length;
  const pendingCount = rows.filter((r) => r.status === "done" && r.resultStatus === "pending").length;

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-black text-srh-navy">Ngarko materiale</h1>
          <p className="mt-3 text-srh-navy/70">
            Zgjidhni një ose më shumë skedarë, kontrolloni të dhënat dhe ngarkojini së bashku.
            Materialet e para shqyrtohen nga moderatorët para publikimit; pasi të aprovohen disa,
            të tjerat publikohen menjëherë.
          </p>
        </header>

        <div className="mb-6 rounded-xl border border-srh-cream bg-srh-cream/60 p-4 text-sm text-srh-navy/75">
          <p>Lejohen: PDF, Word (doc/docx), PowerPoint (ppt/pptx), Excel (xls/xlsx), ZIP</p>
          <p>
            Deri në 50MB për skedar dhe {MAX_FILES_PER_BATCH} skedarë njëherësh. Për ZIP: deri në
            500 skedarë brenda, secili deri në 50MB dhe 100MB gjithsej pasi hapet.
          </p>
          <p>
            Kontrollojmë llojin, madhësinë dhe strukturën e skedarit, por nuk bëjmë skanim antivirusi.
            Ngarkoni vetëm materiale që keni të drejtë t&apos;i ndani.
          </p>
        </div>

        {/* Drop zone */}
        <div className="mb-6">
          <span id="file-label" className="mb-1.5 block text-sm font-bold text-srh-navy">
            Skedarët
          </span>
          <label
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center focus-within:border-srh-crimson focus-within:ring-4 focus-within:ring-burgundy-600/25 hover:border-srh-crimson ${
              isDragging ? "border-srh-crimson bg-srh-blush" : "border-srh-cream bg-white"
            }`}
          >
            <Upload className="mb-3 h-12 w-12 text-srh-crimson" aria-hidden="true" />
            <span className="font-bold text-srh-navy">Klikoni ose tërhiqni skedarët këtu</span>
            <span id="file-hint" className="mt-2 text-sm text-srh-navy/60">
              {ACCEPT_ATTRIBUTE.replace(/,/g, ", ")}
            </span>
            {/* Visually hidden, not display:none, so it stays in the tab order. */}
            <input
              type="file"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              className="sr-only"
              aria-labelledby="file-label"
              aria-describedby="file-hint"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {notice && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-srh-cream bg-white p-4 text-sm font-semibold text-srh-crimson"
          >
            {notice}
          </p>
        )}

        {rows.length > 0 && (
          <>
            {/* Shared details */}
            <section
              aria-labelledby="defaults-heading"
              className="mb-6 rounded-2xl border border-srh-cream bg-white p-5 shadow-sm"
            >
              <h2 id="defaults-heading" className="font-bold text-srh-navy">
                Të dhënat e përbashkëta
              </h2>
              <p className="mt-1 text-sm text-srh-navy/60">
                Vlen për të gjithë skedarët; mund ta ndryshoni për secilin më poshtë.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-semibold text-srh-navy">
                  Fakulteti <span className="text-srh-crimson">*</span>
                  <select
                    value={defaults.faculty}
                    onChange={(e) => setDefault("faculty", e.target.value)}
                    className="input-srh mt-1"
                  >
                    <option value="">Zgjidhni</option>
                    {FACULTIES.map((faculty) => (
                      <option key={faculty.code} value={faculty.code}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-srh-navy">
                  Lloji i materialit
                  <select
                    value={defaults.type}
                    onChange={(e) => {
                      setDefault("type", e.target.value);
                      setDefault("typeLocked", Boolean(e.target.value));
                    }}
                    className="input-srh mt-1"
                  >
                    <option value="">Sipas emrit të skedarit</option>
                    {MATERIAL_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-srh-navy">
                  Niveli i studimit
                  <select
                    value={defaults.study_level}
                    onChange={(e) => setDefault("study_level", e.target.value)}
                    className="input-srh mt-1"
                  >
                    {STUDY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-srh-navy">
                  Lënda
                  <input
                    value={defaults.subject}
                    onChange={(e) => setDefault("subject", e.target.value)}
                    className="input-srh mt-1"
                  />
                </label>
                <label className="block text-sm font-semibold text-srh-navy">
                  Profesori
                  <input
                    value={defaults.teacher}
                    onChange={(e) => setDefault("teacher", e.target.value)}
                    placeholder="//"
                    className="input-srh mt-1"
                  />
                </label>
                <label className="block text-sm font-semibold text-srh-navy">
                  Departamenti
                  <input
                    value={defaults.department}
                    onChange={(e) => setDefault("department", e.target.value)}
                    placeholder="//"
                    className="input-srh mt-1"
                  />
                </label>
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-srh-navy">
                <input
                  type="checkbox"
                  checked={defaults.is_anonymous}
                  onChange={(e) => setDefault("is_anonymous", e.target.checked)}
                  className="h-4 w-4 accent-srh-crimson"
                />
                Publiko si anonim
              </label>
              <p className="mt-1 pl-7 text-xs text-srh-navy/60">
                Emri juaj nuk do të shfaqet publikisht, por mbetet i dukshëm për moderatorët në rast raportimi.
              </p>
            </section>

            {/* Files */}
            <ul className="mb-6 space-y-3" aria-label="Skedarët për ngarkim">
              {rows.map((row) => {
                const fields = effectiveFields(row, defaults);
                const errors = attempted || row.status === "failed" ? validateRow(row, defaults) : {};
                const fileProblem = validateFile(row.file);
                const duplicate = isDuplicate(row);
                const editable = row.status === "ready" || row.status === "failed";
                const isPranues = fields.type === PRANUES;
                const dupInfo = row.duplicate;
                return (
                  <li key={row.id} className="rounded-2xl border border-srh-cream bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-srh-navy">{row.file.name}</p>
                        <p className="text-xs text-srh-navy/60">{formatMegabytes(row.file.size)}MB</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge row={row} />
                        {row.status === "uploading" && (
                          <button type="button" onClick={() => cancelRow(row.id)} className="btn-outline min-h-[36px] px-3 py-1 text-xs">
                            Anulo
                          </button>
                        )}
                        {row.status === "failed" && (
                          <button
                            type="button"
                            onClick={() => {
                              patchRow(row.id, { status: "queued", error: "" });
                              setPaused(false);
                            }}
                            className="btn-outline min-h-[36px] px-3 py-1 text-xs"
                          >
                            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Riprovo
                          </button>
                        )}
                        {row.status !== "uploading" && (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            aria-label={`Hiq ${row.file.name}`}
                            className="rounded-lg p-2 text-srh-navy/60 hover:bg-srh-blush hover:text-srh-crimson"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    {fileProblem && (
                      <p role="alert" className="mt-2 text-sm font-semibold text-srh-crimson">
                        {fileProblem}
                      </p>
                    )}

                    {editable && !fileProblem && (
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <Field label="Titulli" error={errors.title}>
                          <input
                            value={fields.title}
                            onChange={(e) => setOverride(row.id, "title", e.target.value)}
                            aria-invalid={Boolean(errors.title)}
                            className="input-srh min-h-[44px]"
                          />
                        </Field>
                        <Field label="Lloji" error={errors.type}>
                          <select
                            value={fields.type}
                            onChange={(e) => setOverride(row.id, "type", e.target.value)}
                            aria-invalid={Boolean(errors.type)}
                            className="input-srh min-h-[44px]"
                          >
                            <option value="">Zgjidhni</option>
                            {MATERIAL_TYPES.map((type) => (
                              <option key={type}>{type}</option>
                            ))}
                          </select>
                        </Field>
                        {!isPranues && (
                          <Field label="Lënda" error={errors.subject}>
                            <input
                              value={fields.subject}
                              onChange={(e) => setOverride(row.id, "subject", e.target.value)}
                              aria-invalid={Boolean(errors.subject)}
                              className="input-srh min-h-[44px]"
                            />
                          </Field>
                        )}
                      </div>
                    )}
                    {editable && errors.faculty && (
                      <p role="alert" className="mt-2 text-sm font-semibold text-srh-crimson">
                        {errors.faculty}
                      </p>
                    )}

                    {duplicate && row.status === "ready" && (
                      <div className="mt-3 rounded-xl bg-warning-amber/10 p-3 text-sm text-srh-navy">
                        <p className="font-semibold">
                          {dupInfo
                            ? dupInfo.own
                              ? `Duket se e keni ngarkuar tashmë: "${dupInfo.title}".`
                              : `Duket se ky skedar ekziston tashmë: "${dupInfo.title}".`
                            : "Ky skedar është shtuar dy herë në këtë grup."}
                          {dupInfo?.slug && (
                            <>
                              {" "}
                              <Link href={`/materialet/${dupInfo.slug}`} target="_blank" className="underline">
                                Shiko
                              </Link>
                            </>
                          )}
                        </p>
                        <label className="mt-2 flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={row.keepDuplicate}
                            onChange={(e) => patchRow(row.id, { keepDuplicate: e.target.checked })}
                            className="h-4 w-4 accent-srh-crimson"
                          />
                          Ngarko gjithsesi (përndryshe kapërcehet)
                        </label>
                      </div>
                    )}

                    {row.status === "uploading" && (
                      <div
                        role="progressbar"
                        aria-label={`Ngarkimi i ${row.file.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(row.progress * 100)}
                        className="mt-3 h-2 overflow-hidden rounded-full bg-srh-cream"
                      >
                        <div
                          className="h-full rounded-full bg-srh-crimson transition-all duration-200"
                          style={{ width: `${Math.max(3, Math.round(row.progress * 100))}%` }}
                        />
                      </div>
                    )}
                    {row.error && (
                      <p role="alert" className="mt-2 text-sm font-semibold text-srh-crimson">
                        {row.error}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Controls */}
            <div className="sticky bottom-4 z-10 rounded-2xl border border-srh-cream bg-white/95 p-4 shadow-lg backdrop-blur">
              <p aria-live="polite" className="mb-3 text-sm font-semibold text-srh-navy">
                {summary.done} nga {summary.total} u ngarkuan
                {summary.failed > 0 && ` · ${summary.failed} dështuan`}
                {summary.skipped > 0 && ` · ${summary.skipped} u kapërcyen`}
                {summary.active > 0 && ` · ${summary.active} në radhë`}
              </p>
              <div className="flex flex-wrap gap-2">
                {readyCount > 0 && (
                  <button type="button" onClick={startAll} className="btn-primary">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Ngarko {readyCount === 1 ? "skedarin" : `${readyCount} skedarët`}
                  </button>
                )}
                {summary.active > 0 && !paused && (
                  <button type="button" onClick={() => setPaused(true)} className="btn-outline">
                    <Pause className="h-4 w-4" aria-hidden="true" /> Pauzë
                  </button>
                )}
                {summary.queued > 0 && paused && (
                  <button
                    type="button"
                    onClick={() => {
                      setNotice("");
                      setPaused(false);
                    }}
                    className="btn-outline"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" /> Vazhdo
                  </button>
                )}
                {summary.failed > 0 && (
                  <button type="button" onClick={retryFailed} className="btn-outline">
                    <RotateCw className="h-4 w-4" aria-hidden="true" /> Riprovo të dështuarit
                  </button>
                )}
                {summary.finished > 0 && (
                  <button type="button" onClick={clearFinished} className="btn-outline">
                    Pastro të përfunduarit
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {allDone && (
          <div className="mt-6 rounded-2xl border border-srh-cream bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-srh-sage" aria-hidden="true" />
            <h2 className="font-playfair text-2xl font-bold text-srh-navy">
              {pendingCount > 0 ? "Materialet u dërguan" : "Materialet u ngarkuan me sukses!"}
            </h2>
            <p className="mt-2 text-srh-navy/70">
              {publishedCount > 0 && `${publishedCount} u publikuan. `}
              {pendingCount > 0 &&
                `${pendingCount} presin shqyrtimin e një moderatori — do t'ju njoftojmë me email.`}
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/llogaria/materiale-e-mia" className="btn-primary">
                Materialet e mia
              </Link>
              <Link href="/materialet" className="btn-outline">
                Shiko materialet
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-semibold text-srh-navy">
      {label}
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs font-semibold text-srh-crimson">{error}</span>}
    </label>
  );
}

const STATUS_LABELS = {
  ready: { text: "Gati", className: "bg-srh-cream text-srh-navy" },
  queued: { text: "Në radhë", className: "bg-info-blue/10 text-info-blue" },
  uploading: { text: "Duke u ngarkuar", className: "bg-info-blue/10 text-info-blue" },
  done: { text: "U ngarkua", className: "bg-success-green/10 text-success-green" },
  failed: { text: "Dështoi", className: "bg-burgundy-50 text-burgundy-600" },
  skipped: { text: "U kapërcye", className: "bg-srh-cream text-srh-navy/70" },
};

function StatusBadge({ row }) {
  let label = STATUS_LABELS[row.status] || STATUS_LABELS.ready;
  if (row.status === "ready" && row.hashing) label = { text: "Duke kontrolluar…", className: label.className };
  if (row.status === "done" && row.resultStatus === "pending") {
    label = { text: "Në pritje të shqyrtimit", className: "bg-warning-amber/15 text-warning-amber" };
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${label.className}`}>{label.text}</span>
  );
}
