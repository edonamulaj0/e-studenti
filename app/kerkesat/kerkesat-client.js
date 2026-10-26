"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquarePlus, Plus, ThumbsUp, Trash2, Upload } from "lucide-react";
import SubjectInput from "../components/SubjectInput";
import { useT } from "../components/Preferences";
import { fetchCurrentUser } from "../lib/auth";
import { DEFAULT_UNIVERSITY, MATERIAL_TYPES, facultiesFor, getFacultyName } from "../lib/material-options";
import { UNIVERSITIES, universityShort } from "../lib/placement";
import { WORKER_URL } from "../lib/worker-url";

const emptyForm = { university: DEFAULT_UNIVERSITY, faculty: "", subject: "", type: "", details: "" };

function uploadHref(request) {
  const params = new URLSearchParams({
    request: String(request.id),
    university: request.university,
    faculty: request.faculty,
    subject: request.subject,
  });
  if (request.type) params.set("type", request.type);
  return `/llogaria/ngarko?${params.toString()}`;
}

/**
 * Kërkesat: what students are missing. Anyone can read it; signed-in students
 * ask, add their vote, and answer a request by uploading the file.
 */
export default function KerkesatClient() {
  const t = useT();
  const [user, setUser] = useState(undefined);
  const [view, setView] = useState("open");
  const [faculty, setFaculty] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
    // Arriving from a search that found nothing: start a request for it.
    const asked = new URLSearchParams(window.location.search).get("kerko");
    if (asked) {
      setForm((current) => ({ ...current, subject: asked.slice(0, 200) }));
      setFormOpen(true);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ action: "requests", status: view });
      if (faculty) params.set("faculty", faculty);
      const res = await fetch(`${WORKER_URL}/?${params.toString()}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Kërkesat nuk u ngarkuan.");
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Kërkesat nuk u ngarkuan.");
    } finally {
      setLoading(false);
    }
  }, [view, faculty]);

  useEffect(() => {
    load();
  }, [load]);

  const post = async (action, body) => {
    const res = await fetch(`${WORKER_URL}/?action=${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
    return data;
  };

  const toggleVote = async (request) => {
    try {
      const data = await post("vote-request", { id: request.id, vote: !request.voted });
      setRequests((current) =>
        current.map((item) => (item.id === request.id ? { ...item, voted: data.voted, votes: data.votes } : item))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (request) => {
    try {
      await post("remove-request", { id: request.id });
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);
    try {
      const data = await post("create-request", { ...form, type: form.type || null });
      setFormMessage({
        ok: true,
        text: data.merged
          ? "Dikush e kishte kërkuar tashmë këtë material — vota juaj iu shtua asaj kërkese."
          : "Kërkesa u publikua. Do të merrni një email kur dikush ta ngarkojë materialin.",
      });
      setForm(emptyForm);
      setView("open");
      await load();
    } catch (err) {
      setFormMessage({ ok: false, text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const signedIn = Boolean(user);

  return (
    <div className="page-shell">
      <div className="section-shell max-w-4xl">
        <header className="mb-8">
          <p className="page-kicker mb-3">{t("Komuniteti")}</p>
          <h1 className="font-display text-4xl font-bold text-navy-900 md:text-5xl">{t("Kërkesat")}</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            {t("Ju mungon një afat, ligjëratë apo shënime? Kërkojeni këtu. Nëse e ka dikush, e ngarkon — dhe të gjithë që e kërkuan marrin një email.")}
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
          {!formOpen || !signedIn ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-gray-600">{t("Nuk e gjeni atë që ju duhet?")}</p>
              {signedIn ? (
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("Kërko një material")}
                </button>
              ) : (
                <Link
                  href="/llogaria/hyr"
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white"
                >
                  {t("Hyni për të kërkuar")}
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <h2 className="font-bold text-navy-900 md:col-span-2">{t("Kërko një material")}</h2>
              <label className="block text-sm font-semibold text-navy-900">
                {t("Universiteti")}
                <select
                  id="request-university"
                  value={form.university}
                  onChange={(e) => setForm((current) => ({ ...current, university: e.target.value, faculty: "" }))}
                  className="input-srh mt-1"
                >
                  {UNIVERSITIES.map((university) => (
                    <option key={university.slug} value={university.slug}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-navy-900">
                {form.university === DEFAULT_UNIVERSITY ? t("Fakulteti") : t("Fusha e studimit")}{" "}
                <span className="text-burgundy-600">*</span>
                <select
                  id="request-faculty"
                  required
                  value={form.faculty}
                  onChange={(e) => setField("faculty", e.target.value)}
                  className="input-srh mt-1"
                >
                  <option value="">{t("Zgjidhni")}</option>
                  {facultiesFor(form.university).map((option) => (
                    <option key={option.code} value={option.code}>
                      {t(option.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-navy-900">
                {t("Lënda")} <span className="text-burgundy-600">*</span>
                <SubjectInput
                  id="request-subject"
                  required
                  value={form.subject}
                  onChange={(value) => setField("subject", value)}
                  university={form.university}
                  className="input-srh mt-1"
                />
              </label>
              <label className="block text-sm font-semibold text-navy-900">
                {t("Lloji i materialit")}
                <select
                  id="request-type"
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  className="input-srh mt-1"
                >
                  <option value="">{t("Çdo lloj")}</option>
                  {MATERIAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-navy-900 md:col-span-2">
                {t("Çfarë saktësisht? (opsionale)")}
                <textarea
                  id="request-details"
                  value={form.details}
                  maxLength={300}
                  rows={2}
                  onChange={(e) => setField("details", e.target.value)}
                  placeholder={t("p.sh. afatet e qershorit 2025, me zgjidhje")}
                  className="input-srh mt-1"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {submitting ? t("Duke dërguar...") : t("Publiko kërkesën")}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  {t("Anulo")}
                </button>
              </div>
            </form>
          )}
          {formMessage && (
            <p
              role={formMessage.ok ? "status" : "alert"}
              className={`mt-3 text-sm font-semibold ${formMessage.ok ? "text-success-text" : "text-burgundy-600"}`}
            >
              {t(formMessage.text)}
            </p>
          )}
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-surface p-1" role="tablist">
            {[
              ["open", "Të hapura"],
              ["fulfilled", "Të plotësuara"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${
                  view === key ? "bg-ink text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <label className="text-sm text-gray-600">
            <span className="sr-only">{t("Fakulteti")}</span>
            <select
              id="request-filter-faculty"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="input-srh py-2"
            >
              <option value="">{t("Të gjitha fakultetet")}</option>
              {facultiesFor(DEFAULT_UNIVERSITY).map((option) => (
                <option key={option.code} value={option.code}>
                  {t(option.name)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
            {t(error)}
          </p>
        )}

        {loading ? (
          <div className="grid gap-3" role="status" aria-busy="true">
            <span className="sr-only">{t("Duke ngarkuar…")}</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-200 motion-safe:animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-surface p-8 text-center text-gray-600">
            <MessageSquarePlus className="mx-auto mb-3 h-10 w-10 text-burgundy-600" aria-hidden />
            {view === "open"
              ? t("Nuk ka kërkesa të hapura. Jini i pari që kërkon një material.")
              : t("Ende asnjë kërkesë e plotësuar.")}
          </div>
        ) : (
          <ul className="grid gap-3">
            {requests.map((request) => (
              <li
                key={request.id}
                className="grid gap-3 rounded-2xl border border-gray-200 bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <h2 className="font-bold text-navy-900">{request.subject}</h2>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {[
                      getFacultyName(request.faculty),
                      request.university !== DEFAULT_UNIVERSITY && universityShort(request.university),
                      request.type ? t(request.type) : t("Çdo lloj"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {request.details && <p className="mt-2 text-sm text-gray-700">{request.details}</p>}
                </div>

                {view === "open" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {signedIn ? (
                      <button
                        type="button"
                        onClick={() => toggleVote(request)}
                        aria-pressed={request.voted}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold tabular-nums ${
                          request.voted
                            ? "border-burgundy-600 bg-burgundy-50 text-burgundy-600"
                            : "border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" aria-hidden />
                        {request.voted ? t("E doni") : t("Edhe unë")} · {request.votes}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold tabular-nums text-gray-600">
                        <ThumbsUp className="h-4 w-4" aria-hidden />
                        {request.votes}
                      </span>
                    )}
                    <Link
                      href={uploadHref(request)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white"
                    >
                      <Upload className="h-4 w-4" aria-hidden />
                      {t("E kam, e ngarkoj")}
                    </Link>
                    {(request.own || user?.is_moderator) && (
                      <button
                        type="button"
                        onClick={() => remove(request)}
                        className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-burgundy-600"
                        aria-label={t("Hiq kërkesën")}
                        title={t("Hiq kërkesën")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-success-text">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {request.material_slug ? (
                      <Link href={`/materialet/${request.material_slug}`} className="hover:underline">
                        {t("Hape materialin")}
                      </Link>
                    ) : (
                      t("U plotësua")
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
