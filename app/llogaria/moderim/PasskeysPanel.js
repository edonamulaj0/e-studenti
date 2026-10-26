"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, KeyRound, Trash2 } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { passkeysSupported, registerPasskey } from "../../lib/passkeys";
import { useT } from "../../components/Preferences";

/**
 * The moderator's passkeys. With at least one registered, signing in takes the
 * emailed code and then the passkey; with none, the code alone.
 */
export default function PasskeysPanel() {
  const t = useT();
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [supported, setSupported] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}/?action=passkeys`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Lista nuk u ngarkua.");
      setPasskeys(data.passkeys || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSupported(passkeysSupported());
    load();
  }, [load]);

  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await registerPasskey(name.trim());
      setName("");
      setNotice("Passkey u shtua. Herën tjetër që hyni, pas kodit do t'ju kërkohet ky passkey.");
      await load();
    } catch (err) {
      setError(err.message || "Passkey nuk u shtua.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setError("");
    setNotice("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=delete-passkey`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-gray-200 bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold text-navy-900">
          <Fingerprint className="h-5 w-5" aria-hidden />
          {t("Passkey për llogarinë e moderatorit")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          {passkeys.length > 0
            ? t("Hyrja kërkon kodin nga emaili dhe pastaj passkey-n. Mbani të paktën dy (p.sh. telefoni dhe laptopi), që të mos mbeteni jashtë nëse humbni njërin.")
            : t("Tani hyrja kërkon vetëm kodin nga emaili. Shtoni një passkey (Face ID, Touch ID, Windows Hello ose çelës sigurie) që askush të mos hyjë vetëm me emailin tuaj.")}
        </p>

        {!supported ? (
          <p className="mt-4 text-sm font-semibold text-burgundy-600">{t("Ky shfletues nuk mbështet passkey.")}</p>
        ) : (
          <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block text-sm font-semibold text-navy-900">
              {t("Emri i pajisjes")}
              <input
                id="passkey-name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("p.sh. Laptopi")}
                className="input-srh mt-1"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              {busy ? t("Duke pritur pajisjen…") : t("Shto passkey")}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-burgundy-600">
            {t(error)}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm font-semibold text-success-text">
            {t(notice)}
          </p>
        )}
      </section>

      {loading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-surface" role="status" aria-busy="true" />
      ) : (
        passkeys.length > 0 && (
          <ul className="grid gap-2">
            {passkeys.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-bold text-navy-900">{key.name || t("Passkey")}</p>
                  <p className="text-xs text-gray-500">
                    {t("Shtuar më {date}", { date: String(key.created_at || "").slice(0, 10) })}
                    {key.last_used_at && ` · ${t("përdorur më {date}", { date: String(key.last_used_at).slice(0, 10) })}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(key.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-burgundy-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t("Hiq")}
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
