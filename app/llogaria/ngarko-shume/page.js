"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FolderUp, Loader2, Trash2, Upload } from "lucide-react";
import { fetchCurrentUser } from "../../lib/auth";
import { FACULTIES, MATERIAL_TYPES } from "../../lib/material-options";
import { STUDY_LEVELS } from "../../lib/study-levels";
import {
  ALLOWED_EXTENSIONS,
  MAX_BATCH_FILES,
  UPLOAD_CONCURRENCY,
  commitUploads,
  filesFromDrop,
  filesFromInput,
  formatBytes,
  putToPresignedUrl,
  requestUploadUrls,
  runWithConcurrency,
  toUploadRows,
} from "../../lib/bulk-upload";

const ACCEPT = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

const emptyHeader = {
  title: "",
  faculty: "",
  department: "",
  subject: "",
  study_level: "bachelor",
};

/** The collection cannot be created until these are set, so uploads wait for them. */
function headerIsComplete(header) {
  return Boolean(header.faculty && header.subject.trim() && header.title.trim());
}

export default function NgarkoShumePage() {
  const router = useRouter();
  const [header, setHeader] = useState(emptyHeader);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | uploading | publishing | done
  const [summary, setSummary] = useState(null);

  const abortsRef = useRef(new Map());
  const startedRef = useRef(false);

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (!user) router.push("/llogaria/hyr");
    });
  }, [router]);

  const setField = (field, value) => setHeader((current) => ({ ...current, [field]: value }));
  const patchRow = useCallback((id, patch) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const counts = useMemo(() => {
    const by = (status) => rows.filter((row) => row.status === status).length;
    return {
      total: rows.length,
      queued: by("queued"),
      uploading: by("uploading"),
      uploaded: by("uploaded"),
      invalid: by("invalid"),
      failed: by("failed"),
      published: by("published"),
    };
  }, [rows]);

  const readyToPublish =
    counts.uploaded > 0 && counts.uploading === 0 && counts.queued === 0 && phase !== "publishing";

  // Warn before losing an upload in flight.
  useEffect(() => {
    if (phase !== "uploading") return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const addFiles = (collected) => {
    const fresh = toUploadRows(collected);
    if (!fresh.length) return;
    const room = MAX_BATCH_FILES - rows.length;
    setError(
      fresh.length > room
        ? `Deri në ${MAX_BATCH_FILES} skedarë në një ngarkim. Të tepërt u anashkaluan.`
        : ""
    );
    if (room <= 0) return;
    setRows((current) => [...current, ...fresh.slice(0, room)]);
  };

  /**
   * Uploads everything still queued.
   *
   * Bytes start moving as soon as there is something to send and the header is
   * complete, rather than waiting for the form to be filled in — by the time
   * someone has finished correcting titles, the upload is usually done.
   */
  const startUpload = useCallback(async () => {
    const queued = rows.filter((row) => row.status === "queued");
    if (!queued.length) return;

    setPhase("uploading");
    setError("");
    queued.forEach((row) => patchRow(row.id, { status: "uploading", progress: 0 }));

    let issued;
    try {
      const response = await requestUploadUrls({
        collection: {
          title: header.title.trim(),
          faculty: header.faculty,
          department: header.department.trim() || "//",
          subject: header.subject.trim(),
          study_level: header.study_level,
          is_anonymous: isAnonymous ? 1 : 0,
        },
        files: queued.map((row) => ({ filename: row.file.name, size: row.file.size })),
      });
      issued = response.files;
    } catch (err) {
      setError(err.message || "Ngarkimi nuk mund të fillonte.");
      queued.forEach((row) => patchRow(row.id, { status: "queued", progress: 0 }));
      setPhase("idle");
      return;
    }

    await runWithConcurrency(queued, UPLOAD_CONCURRENCY, async (row, index) => {
      const target = issued[index];
      try {
        await putToPresignedUrl(
          row.file,
          target.url,
          (fraction) => patchRow(row.id, { progress: fraction }),
          (abort) => abortsRef.current.set(row.id, abort)
        );
        patchRow(row.id, { status: "uploaded", progress: 1, key: target.key, error: "" });
      } catch (err) {
        patchRow(row.id, { status: "failed", error: err.message || "Ngarkimi dështoi." });
      } finally {
        abortsRef.current.delete(row.id);
      }
    });

    setPhase("idle");
  }, [rows, header, isAnonymous, patchRow]);

  // Kick off as soon as both conditions hold, whichever arrives last.
  useEffect(() => {
    if (phase !== "idle") return;
    if (!headerIsComplete(header)) return;
    if (!rows.some((row) => row.status === "queued")) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    startUpload().finally(() => {
      startedRef.current = false;
    });
  }, [rows, header, phase, startUpload]);

  const removeRow = (id) => {
    abortsRef.current.get(id)?.();
    abortsRef.current.delete(id);
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const retryRow = (id) => patchRow(id, { status: "queued", progress: 0, error: "" });

  const publish = async () => {
    const ready = rows.filter((row) => row.status === "uploaded");
    const missingType = ready.find((row) => !row.type);
    if (missingType) {
      setError("Zgjidhni llojin për çdo material.");
      return;
    }

    setPhase("publishing");
    setError("");
    try {
      const response = await commitUploads(
        ready.map((row) => ({ key: row.key, title: row.title.trim(), type: row.type }))
      );
      const byKey = new Map(response.results.map((result) => [result.key, result]));
      setRows((current) =>
        current.map((row) => {
          const result = byKey.get(row.key);
          if (!result) return row;
          // Left as "uploaded" rather than "failed": a rejected type or title
          // is fixed in place and published again, without re-uploading the
          // bytes. If the file itself was rejected and discarded, the next
          // attempt reports that instead.
          return result.ok
            ? { ...row, status: "published", error: "" }
            : { ...row, status: "uploaded", error: result.error };
        })
      );
      setSummary({ published: response.published, failed: response.failed });
      setPhase(response.failed > 0 ? "idle" : "done");
    } catch (err) {
      setError(err.message || "Publikimi dështoi.");
      setPhase("idle");
    }
  };

  if (phase === "done" && summary) {
    return (
      <div className="min-h-screen bg-srh-paper px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-srh-cream bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-srh-sage" />
          <h2 className="font-playfair text-3xl font-bold text-srh-navy">
            {summary.published} materiale u publikuan
          </h2>
          <p className="mt-2 text-srh-navy/70">Të gjitha janë pjesë e “{header.title}”.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/materialet"
              className="rounded-xl bg-srh-crimson px-6 py-3 font-bold text-white hover:bg-[#5e1621]"
            >
              Shiko materialet
            </Link>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setSummary(null);
                setPhase("idle");
              }}
              className="rounded-xl border-2 border-srh-navy px-6 py-3 font-bold text-srh-navy hover:bg-srh-navy hover:text-white"
            >
              Ngarko të tjera
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="font-playfair text-4xl font-black text-srh-navy md:text-5xl">
            Ngarko shumë materiale
          </h1>
          <p className="mt-3 text-srh-navy/70">
            Tërhiqni një dosje të tërë. Skedarët ngarkohen menjëherë; titujt korrigjohen më pas.
          </p>
          <Link
            href="/llogaria/ngarko"
            className="mt-2 inline-block text-sm text-srh-crimson underline underline-offset-4"
          >
            Ngarko vetëm një material
          </Link>
        </header>

        {/* Shared metadata: set once, applies to every file in the batch. */}
        <section className="mb-5 rounded-2xl border border-srh-cream bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-srh-navy">Të përbashkëta për të gjitha</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Emri i koleksionit" required>
              <input
                value={header.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="p.sh. Algjebra Lineare — Ligjërata"
                className="input-srh"
              />
            </Field>
            <Field label="Fakulteti" required>
              <select
                value={header.faculty}
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
            <Field label="Lënda" required>
              <input
                value={header.subject}
                onChange={(e) => setField("subject", e.target.value)}
                className="input-srh"
              />
            </Field>
            <Field label="Departamenti">
              <input
                value={header.department}
                onChange={(e) => setField("department", e.target.value)}
                placeholder="//"
                className="input-srh"
              />
            </Field>
            <Field label="Niveli i studimit" required>
              <select
                value={header.study_level}
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
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-srh-navy">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 accent-srh-crimson"
            />
            Publiko të gjitha si anonim
          </label>
        </section>

        {/* Dropzone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(await filesFromDrop(e.dataTransfer));
          }}
          className={`mb-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-5 py-10 text-center transition-colors ${
            dragging ? "border-srh-crimson bg-srh-blush/20" : "border-srh-cream hover:border-srh-crimson"
          }`}
        >
          <FolderUp className="mb-3 h-12 w-12 text-srh-crimson" />
          <span className="font-bold text-srh-navy">
            Tërhiqni skedarët ose dosjen këtu
          </span>
          <span className="mt-2 text-sm text-srh-navy/60">
            {ACCEPT.replace(/,/g, ", ")} · deri në 50MB për skedar
          </span>
          <input
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              addFiles(filesFromInput(e.target.files));
              e.target.value = "";
            }}
          />
        </label>

        {!headerIsComplete(header) && rows.length > 0 && (
          <p className="mb-4 rounded-xl border border-srh-cream bg-srh-cream/60 p-4 text-sm font-semibold text-srh-navy/80">
            Plotësoni emrin e koleksionit, fakultetin dhe lëndën — ngarkimi fillon vetë.
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-srh-cream bg-white p-4 text-sm font-semibold text-srh-crimson">
            {error}
          </p>
        )}

        {rows.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-srh-cream bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-srh-cream px-5 py-3 text-sm">
              <span className="font-bold text-srh-navy">
                {counts.total} skedarë
                {counts.uploaded > 0 && ` · ${counts.uploaded} gati`}
                {counts.failed > 0 && ` · ${counts.failed} dështuan`}
              </span>
              <BulkTypeSetter
                onSet={(type) =>
                  setRows((current) =>
                    current.map((row) => (row.status === "uploaded" ? { ...row, type } : row))
                  )
                }
              />
            </div>

            <ul className="divide-y divide-srh-cream">
              {rows.map((row) => (
                <UploadRow
                  key={row.id}
                  row={row}
                  onTitle={(title) => patchRow(row.id, { title })}
                  onType={(type) => patchRow(row.id, { type })}
                  onRemove={() => removeRow(row.id)}
                  onRetry={() => retryRow(row.id)}
                />
              ))}
            </ul>
          </section>
        )}

        {rows.length > 0 && (
          <button
            type="button"
            onClick={publish}
            disabled={!readyToPublish}
            className="mt-6 w-full rounded-xl bg-srh-crimson py-4 text-lg font-bold text-white hover:bg-[#5e1621] disabled:opacity-60"
          >
            {phase === "publishing"
              ? "Duke publikuar..."
              : counts.uploading > 0 || counts.queued > 0
                ? `Duke ngarkuar... (${counts.uploaded}/${counts.total})`
                : `Publiko ${counts.uploaded} materiale`}
          </button>
        )}
      </div>
    </div>
  );
}

function UploadRow({ row, onTitle, onType, onRemove, onRetry }) {
  return (
    <li className="grid grid-cols-1 items-center gap-3 px-5 py-3 sm:grid-cols-[1fr_11rem_9rem_2rem]">
      <div className="min-w-0">
        <input
          value={row.title}
          onChange={(e) => onTitle(e.target.value)}
          disabled={row.status === "published"}
          className="w-full rounded-lg border border-srh-cream px-3 py-2 text-sm font-semibold text-srh-navy disabled:bg-srh-paper"
        />
        <p className="mt-1 truncate text-xs text-srh-navy/50">
          {row.folder && <span className="text-srh-navy/40">{row.folder}/</span>}
          {row.file.name} · {formatBytes(row.file.size)}
        </p>
      </div>

      <select
        value={row.type}
        onChange={(e) => onType(e.target.value)}
        disabled={row.status === "published"}
        aria-label={`Lloji për ${row.file.name}`}
        className="rounded-lg border border-srh-cream px-3 py-2 text-sm disabled:bg-srh-paper"
      >
        <option value="">Lloji…</option>
        {MATERIAL_TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>

      <RowStatus row={row} onRetry={onRetry} />

      <button
        type="button"
        onClick={onRemove}
        aria-label="Hiq skedarin"
        className="justify-self-end rounded-lg p-2 text-srh-navy/40 hover:bg-srh-blush/20 hover:text-srh-crimson"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function RowStatus({ row, onRetry }) {
  if (row.status === "uploading") {
    return (
      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-srh-cream">
          <div
            className="h-full rounded-full bg-srh-crimson transition-all duration-200"
            style={{ width: `${Math.max(3, Math.round(row.progress * 100))}%` }}
          />
        </div>
        <span className="text-xs text-srh-navy/50">{Math.round(row.progress * 100)}%</span>
      </div>
    );
  }
  if (row.status === "uploaded") {
    if (row.error) {
      return (
        <span
          title={row.error}
          className="flex items-center gap-1 text-xs font-semibold text-srh-crimson"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{row.error}</span>
        </span>
      );
    }
    return <span className="text-xs font-semibold text-srh-sage">Gati</span>;
  }
  if (row.status === "published") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-srh-sage">
        <CheckCircle2 className="h-4 w-4" /> Publikuar
      </span>
    );
  }
  if (row.status === "invalid" || row.status === "failed") {
    return (
      <div className="min-w-0">
        <span
          title={row.error}
          className="flex items-center gap-1 text-xs font-semibold text-srh-crimson"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{row.error}</span>
        </span>
        {row.status === "failed" && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-srh-navy/60 underline underline-offset-2"
          >
            Provo përsëri
          </button>
        )}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-srh-navy/50">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Në pritje
    </span>
  );
}

/** Sets the type on every uploaded row at once — thirty dropdowns is where people give up. */
function BulkTypeSetter({ onSet }) {
  return (
    <label className="flex items-center gap-2 text-sm text-srh-navy/70">
      <Upload className="h-4 w-4" aria-hidden />
      Vendos llojin për të gjitha
      <select
        defaultValue=""
        aria-label="Vendos llojin për të gjitha"
        onChange={(e) => {
          if (e.target.value) onSet(e.target.value);
          e.target.value = "";
        }}
        className="rounded-lg border border-srh-cream px-2 py-1 text-sm"
      >
        <option value="">Zgjidh…</option>
        {MATERIAL_TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
    </label>
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
