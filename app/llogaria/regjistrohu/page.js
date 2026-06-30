"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Mail, User, Users } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { setUser } from "../../lib/auth";
import { isDisposableEmail, DISPOSABLE_EMAIL_ERROR } from "../../lib/disposable-email-domains";

export default function RegjistrohuPage() {
  const router = useRouter();
  const [step, setStep] = useState("register");
  const [form, setForm] = useState({ name: "", surname: "", email: "" });
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      if (!res.ok) throw new Error(data.error || "Dërgimi dështoi.");
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verifikimi dështoi.");
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
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-lg lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden min-h-[38rem] overflow-hidden bg-gradient-to-br from-burgundy-600 to-navy-900 p-12 text-white lg:block">
          <img
            src="/uplogo.svg"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-20 -right-16 h-80 w-80 opacity-10"
          />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                Bashkohu me komunitetin
              </p>
              <h1 className="max-w-lg font-display text-5xl font-bold leading-tight">
                Ndaje një material dhe bëje semestrin më të lehtë për dikë tjetër.
              </h1>
            </div>
            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <Users className="mb-3 h-6 w-6" />
              <p className="text-lg font-semibold">500+ studentë aktiv</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Materialet e komunitetit bëhen më të dobishme sa herë që dikush
                kontribuon.
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 md:p-10 lg:p-12">
        <div className="mb-8">
          <p className="page-kicker mb-4">Llogaria</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-navy-900 md:text-5xl">
            {step === "register" ? "Krijo llogari" : "Verifikoni emailin"}
          </h1>
          <p className="mt-3 text-gray-600">
            Ngarko dhe menaxho materialet e tua për komunitetin.
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
                    : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-white">
                  {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                {label}
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
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="input-srh pl-12"
                />
              </Field>
              <Field label="Mbiemri" icon={User}>
                <input
                  required
                  value={form.surname}
                  onChange={(e) => update("surname", e.target.value)}
                  className="input-srh pl-12"
                />
              </Field>
              <Field label="Email" icon={Mail}>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="input-srh pl-12"
                />
              </Field>
              <Status error={error} message={message} />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base"
              >
                {loading ? "Duke dërguar..." : "Dërgo kodin"}
              </button>
              <p className="text-center text-sm text-gray-600">
                Keni llogari?{" "}
                <Link href="/llogaria/hyr" className="font-semibold text-burgundy-600">
                  Hyr këtu
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              <p className="rounded-2xl border border-gray-200 bg-navy-100/50 p-4 text-gray-600">
                Kodi u dërgua te <strong>{form.email}</strong>. Kontrolloni edhe
                spam/junk.
              </p>
              <Field label="Kodi 6-shifror" icon={KeyRound}>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
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
                {loading ? "Duke verifikuar..." : "Verifikoni"}
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={loading}
                className="w-full font-semibold text-burgundy-600 hover:underline disabled:opacity-60"
              >
                Nuk e morët kodin? Dërgoni përsëri
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
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy-900">{label}</span>
      <span className="relative block">
        {Icon ? (
          <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        ) : null}
        {children}
      </span>
    </label>
  );
}

function Status({ error, message }) {
  if (error) return <p className="rounded-2xl bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">{error}</p>;
  if (message) return <p className="rounded-2xl bg-success-green/10 p-4 text-sm font-semibold text-success-green">{message}</p>;
  return null;
}
