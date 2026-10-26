"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Mail, User, Users } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { setUser } from "../../lib/auth";
import { useT } from "../../components/Preferences";
import { translateMessage } from "../../lib/bulk-upload";
import { isDisposableEmail, DISPOSABLE_EMAIL_ERROR } from "../../lib/disposable-email-domains";
import { completePasskeyLogin } from "../../lib/passkeys";

export default function RegjistrohuPage() {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState("register");
  const [form, setForm] = useState({ name: "", surname: "", email: "" });
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const sendCode = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    if (isDisposableEmail(form.email.trim())) {
      setError(DISPOSABLE_EMAIL_ERROR);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${WORKER_URL}/?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          surname: form.surname.trim(),
          email: form.email.trim().toLowerCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && data.retryAfter) {
        setCooldown(data.retryAfter);
        setError(data.error || "Prisni pak para se të dërgoni kodin përsëri.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Dërgimi dështoi.");
      setCooldown(60);
      setStep("verify");
      setMessage(data.message || "Kodi u dërgua në emailin tuaj.");
    } catch (err) {
      setError(err.message || "Dërgimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          code: code.trim(),
        }),
      });
      let data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verifikimi dështoi.");
      // The moderator confirms with a passkey after the emailed code.
      if (data.passkey_required) data = await completePasskeyLogin(data.passkey);
      setUser(data.user);
      router.push("/llogaria/materiale-e-mia");
    } catch (err) {
      setError(err.message || "Verifikimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-surface shadow-lg lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden min-h-[38rem] overflow-hidden bg-gradient-to-br from-burgundy-600 to-ink p-12 text-white lg:block">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                {t("Bashkohu me komunitetin")}
              </p>
              <h1 className="max-w-lg font-display text-5xl font-bold leading-tight">
                {t("Ndaje një material dhe bëje semestrin më të lehtë për dikë tjetër.")}
              </h1>
            </div>
            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <Users className="mb-3 h-6 w-6" />
              <p className="text-lg font-semibold">{t("Nga komuniteti, për çdo student")}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {t("Materialet e komunitetit bëhen më të dobishme sa herë që dikush kontribuon.")}
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 md:p-10 lg:p-12">
        <div className="mb-8">
          <p className="page-kicker mb-4">{t("Llogaria")}</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-navy-900 md:text-5xl">
            {step === "register" ? t("Krijo llogari") : t("Verifikoni emailin")}
          </h1>
          <p className="mt-3 text-gray-600">
            {t("Ngarko dhe menaxho materialet e tua për komunitetin.")}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {["Të dhënat", "Verifikimi"].map((label, index) => {
            const active = (step === "register" && index === 0) || (step === "verify" && index === 1);
            const done = step === "verify" && index === 0;
            return (
              <div
                key={label}
                className={`rounded-2xl border p-3 text-sm font-semibold ${
                  active || done
                    ? "border-burgundy-600/20 bg-burgundy-50 text-burgundy-600"
                    : "border-gray-200 bg-surface text-gray-500"
                }`}
              >
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface">
                  {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                {t(label)}
              </div>
            );
          })}
        </div>

        <div className="surface-card p-6 md:p-8">
          {step === "register" ? (
            <form onSubmit={sendCode} className="space-y-5">
              <Field label="Emri" icon={User}>
                <input
                  required
                  autoComplete="given-name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="input-srh pl-12"
                />
              </Field>
              <Field label="Mbiemri" icon={User}>
                <input
                  required
                  autoComplete="family-name"
                  value={form.surname}
                  onChange={(e) => update("surname", e.target.value)}
                  className="input-srh pl-12"
                />
              </Field>
              <Field label="Email" icon={Mail}>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="input-srh pl-12"
                />
              </Field>
              <Status error={error} message={message} />
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="btn-primary w-full text-base"
              >
                {loading ? t("Duke dërguar...") : cooldown > 0 ? t("Dërgo kodin ({n}s)", { n: cooldown }) : t("Dërgo kodin")}
              </button>
              <p className="text-center text-sm text-gray-600">
                {t("Keni llogari?")}{" "}
                <Link href="/llogaria/hyr" className="font-semibold text-burgundy-600">
                  {t("Hyr këtu")}
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              <p className="rounded-2xl border border-gray-200 bg-navy-100/50 p-4 text-gray-600">
                {t("Kodi u dërgua te")} <strong>{form.email}</strong>. {t("Kontrolloni edhe spam/junk.")}
              </p>
              <Field label="Kodi 8-shifror" icon={KeyRound}>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  className="input-srh pl-12 text-center text-2xl tracking-[0.4em]"
                />
              </Field>
              <Status error={error} message={message} />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base"
              >
                {loading ? t("Duke verifikuar...") : t("Verifikoni")}
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={loading || cooldown > 0}
                className="w-full font-semibold text-burgundy-600 hover:underline disabled:opacity-60"
              >
                {cooldown > 0
                  ? t("Dërgoni përsëri ({n}s)", { n: cooldown })
                  : t("Nuk e morët kodin? Dërgoni përsëri")}
              </button>
            </form>
          )}
        </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  const t = useT();
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy-900">{t(label)}</span>
      <span className="relative block">
        {Icon ? (
          <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        ) : null}
        {children}
      </span>
    </label>
  );
}

function Status({ error, message }) {
  const t = useT();
  if (error) return <p role="alert" className="rounded-2xl bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">{translateMessage(t, error)}</p>;
  if (message) return <p role="status" className="rounded-2xl bg-success-green/10 p-4 text-sm font-semibold text-success-text">{translateMessage(t, message)}</p>;
  return null;
}
