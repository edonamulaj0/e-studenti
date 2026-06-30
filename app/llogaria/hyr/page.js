"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Users } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { setUser } from "../../lib/auth";

export default function HyrPage() {
  const router = useRouter();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
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

  const sendCode = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && data.retryAfter) {
        setCooldown(data.retryAfter);
        setError(data.error || "Prisni pak para se të dërgoni kodin përsëri.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Dërgimi dështoi.");
      setCooldown(60);
      setStep("code");
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
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verifikimi dështoi.");
      setUser(data.user);
      const linked = data.linked_materials_count || 0;
      router.push(linked > 0
        ? `/llogaria/materiale-e-mia?linked=${linked}`
        : "/llogaria/materiale-e-mia"
      );
    } catch (err) {
      setError(err.message || "Verifikimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-lg lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden min-h-[34rem] overflow-hidden bg-gradient-to-br from-navy-900 to-navy-700 p-12 text-white lg:block">
          <img
            src="/uplogo.svg"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-20 -right-16 h-80 w-80 opacity-10"
          />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                Mirë se u ktheve
              </p>
              <h1 className="max-w-lg font-display text-5xl font-bold leading-tight">
                Vazhdo aty ku e ke lënë semestrin.
              </h1>
            </div>
            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <Users className="mb-3 h-6 w-6 text-burgundy-50" />
              <p className="text-lg font-semibold">500+ studentë aktiv</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Shfleto, ruaj dhe menaxho materialet që ndihmojnë komunitetin.
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 md:p-10 lg:p-12">
        <div className="mb-8">
          <p className="page-kicker mb-4">Llogaria</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-navy-900 md:text-5xl">
            Hyr në llogari
          </h1>
          <p className="mt-3 text-gray-600">
            Hyrja bëhet me kod të dërguar në email.
          </p>
        </div>
        <div className="surface-card p-6 md:p-8">
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-navy-900">
                  Email
                </span>
                <span className="relative block">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-srh pl-12"
                />
                </span>
              </label>
              <Status error={error} message={message} />
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="btn-primary w-full text-base"
              >
                {loading ? "Duke dërguar..." : cooldown > 0 ? `Dërgo kodin (${cooldown}s)` : "Dërgo kodin e hyrjes"}
              </button>
              <p className="text-center text-sm text-gray-600">
                Nuk keni llogari?{" "}
                <Link
                  href="/llogaria/regjistrohu"
                  className="font-semibold text-burgundy-600"
                >
                  Regjistrohu
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              <p className="rounded-2xl border border-gray-200 bg-navy-100/50 p-4 text-gray-600">
                Kodi u dërgua te <strong>{email}</strong>. Kontrolloni edhe
                spam/junk.
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-navy-900">
                  Kodi 6-shifror
                </span>
                <span className="relative block">
                  <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
                </span>
              </label>
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
                disabled={loading || cooldown > 0}
                className="w-full font-semibold text-burgundy-600 hover:underline disabled:opacity-60"
              >
                {cooldown > 0
                  ? `Dërgoni përsëri (${cooldown}s)`
                  : "Nuk e morët kodin? Dërgoni përsëri"}
              </button>
            </form>
          )}
        </div>
        </section>
      </div>
    </div>
  );
}

function Status({ error, message }) {
  if (error) return <p className="rounded-2xl bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">{error}</p>;
  if (message) return <p className="rounded-2xl bg-success-green/10 p-4 text-sm font-semibold text-success-green">{message}</p>;
  return null;
}
