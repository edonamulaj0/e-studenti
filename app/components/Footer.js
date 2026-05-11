"use client";
import Link from "next/link";

const sections = [
  {
    title: "Platforma",
    links: [
      { href: "/", label: "Ballina" },
      { href: "/fakultetet", label: "Fakultetet" },
      { href: "/materialet", label: "Materialet" },
      { href: "/erasmus", label: "Erasmus+" },
      { href: "/informacione", label: "Rreth nesh" },
    ],
  },
  {
    title: "Llogaria",
    links: [
      { href: "/llogaria/regjistrohu", label: "Regjistrohu" },
      { href: "/llogaria/hyr", label: "Hyr" },
      { href: "/llogaria/ngarko", label: "Ngarko material" },
      { href: "/llogaria/materiale-e-mia", label: "Materialet e mia" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-navy-900 text-white">
      <img
        src="/uplogo.svg"
        alt=""
        aria-hidden="true"
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
            <p className="mt-5 text-xs font-medium text-white/40">
              © 2026 E-Studenti.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
                  {section.title}
                </p>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg py-0.5 text-white/68 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
                  Ligjore
                </p>
                <Link
                  href="/privatesia"
                  className="block rounded-lg py-0.5 text-white/68 transition-colors hover:text-white"
                >
                  Politika e privatësisë
                </Link>
                <Link
                  href="/kushtet"
                  className="block rounded-lg py-0.5 text-white/68 transition-colors hover:text-white"
                >
                  Kushtet e shërbimit
                </Link>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
                  Komuniteti
                </p>
              <a
                href="https://github.com/edonamulaj0/e-studenti"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg py-0.5 text-white/68 transition-colors hover:text-white"
              >
                GitHub
              </a>
              <span className="block text-white/50">E mirëmbajtur nga komuniteti.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
