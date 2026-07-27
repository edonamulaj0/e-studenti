"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../lib/auth";
import { VIBER_URL } from "./ViberIcon";

const INSTAGRAM_URL = "https://www.instagram.com/estudenti.hub";

const platformaLinks = [
  { href: "/", label: "Ballina" },
  { href: "/fakultetet", label: "Fakultetet" },
  { href: "/materialet", label: "Materialet" },
  { href: "/erasmus", label: "Erasmus+" },
  { href: "/informacione", label: "Rreth nesh" },
];

const accountLinks = [
  { href: "/llogaria/ngarko", label: "Ngarko material" },
  { href: "/llogaria/materiale-e-mia", label: "Materialet e mia" },
];

const linkClass =
  "block rounded-lg py-0.5 text-white/68 transition-colors hover:text-white";
const headingClass =
  "text-xs font-semibold uppercase tracking-widest text-white/65";

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      fetchCurrentUser().then((user) => setIsLoggedIn(!!user));
    };
    syncAuth();
    window.addEventListener("srh-auth-change", syncAuth);
    return () => window.removeEventListener("srh-auth-change", syncAuth);
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-navy-900 text-white">
      <img
        src="/uplogo.svg"
        alt=""
        aria-hidden="true"
        width={446}
        height={445}
        loading="lazy"
        fetchPriority="low"
        decoding="async"
        className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 opacity-10 mix-blend-screen md:-bottom-36 md:-right-24 md:h-96 md:w-96"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:px-12">
        <div className="grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-start">
          <Link
            href="/"
            className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/8 p-3 md:h-32 md:w-32"
            aria-label="E-Studenti"
          >
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={2480}
              height={3508}
              className="h-full w-auto shrink-0 object-contain"
            />
          </Link>

          <div className="max-w-sm">
            <Link href="/" className="font-display text-3xl font-bold tracking-tight">
              E-Studenti
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              Platformë komunitare për materiale studimore dhe burime të dobishme
              për studentët e UP-së.
            </p>
            <p className="mt-5 text-xs font-medium text-white/70">
              © 2026 E-Studenti.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className={headingClass}>Platforma</p>
              {platformaLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2">
              <p className={headingClass}>Komuniteti</p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Instagram
              </a>
              <a
                href={VIBER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Viber
              </a>
              <a
                href="https://github.com/edonamulaj0/e-studenti"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                GitHub
              </a>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <p className={headingClass}>Llogaria</p>
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={isLoggedIn ? link.href : "/llogaria/regjistrohu"}
                    className={linkClass}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="space-y-2">
                <p className={headingClass}>Ligjore</p>
                <Link href="/privatesia" className={linkClass}>
                  Politika e privatësisë
                </Link>
                <Link href="/kushtet" className={linkClass}>
                  Kushtet e shërbimit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
