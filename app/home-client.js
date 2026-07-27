"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Sparkles,
  Users,
  ArrowRight,
  GraduationCap,
  Building2,
  BookOpen,
  Link2,
  HelpCircle,
  Upload,
} from "lucide-react";
import ViberIcon, { VIBER_URL } from "./components/ViberIcon";

const fadeUp = {
  initial: false,
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2, margin: "0px 0px -8% 0px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export default function HomeClient() {
  return (
    <div className="relative bg-cream-50">
      <section className="viewport-section relative isolate overflow-hidden bg-gradient-to-br from-cream-50 via-beige-100 to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-10 h-80 w-80 bg-[url('/uplogo.svg')] bg-contain bg-center bg-no-repeat opacity-10 mix-blend-multiply sm:h-[28rem] sm:w-[28rem] lg:right-4 lg:top-16 lg:h-[34rem] lg:w-[34rem]"
        />
        <div className="pointer-events-none absolute left-0 top-20 h-64 w-64 rounded-full bg-burgundy-50 blur-3xl md:h-96 md:w-96" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div {...fadeUp} className="max-w-3xl">
            <p className="page-kicker mb-6">
              Nga komuniteti · Për çdo student
            </p>
            <h1 className="page-title mb-6">
              Materialet e UP-së, më të qarta dhe më të lehta për t'u gjetur.
            </h1>
            <p className="page-subtitle max-w-2xl text-lg md:text-xl">
              E-Studenti mbledh shënime, afate, projekte dhe burime praktike në
              një hapësirë të thjeshtë për studentët e Universitetit të
              Prishtinës.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-warning-amber/20 bg-warning-amber/10 px-4 py-2 text-sm font-semibold text-navy-800">
              Faqe komunitare, jo e lidhur zyrtarisht me Universitetin e Prishtinës.
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/materialet" className="btn-primary text-base">
                Shiko materialet
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/llogaria/ngarko" className="btn-outline text-base">
                Ngarko Materialin Tënd
              </Link>
              <a
                href={VIBER_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bashkohu në Viber"
                className="btn-viber w-full justify-center text-base sm:w-12 sm:px-0"
              >
                <ViberIcon className="h-6 w-6" />
                <span className="sm:hidden">Bashkohu në Viber</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <div className="surface-card ml-auto max-w-md p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-navy-100 px-3 py-1 text-sm font-semibold text-navy-800">
                  Semestri aktiv
                </span>
                <Sparkles className="h-5 w-5 text-burgundy-600" />
              </div>
              <div className="space-y-3">
                {["Algoritme", "Financa", "Psikologji"].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Material #{index + 1}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-navy-900">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-12 md:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="mx-auto mb-8 max-w-2xl text-center">
            <p className="page-kicker mb-4">Pse ekziston</p>
            <h2 className="font-display text-3xl font-bold leading-tight text-navy-900 md:text-4xl">
              Pse E-Studenti?
            </h2>
            <p className="page-subtitle mx-auto mt-3 max-w-xl">
              I hapur, i lexueshëm dhe i përditësuar nga komuniteti.
            </p>
          </motion.div>

          <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Transparencë",
                text: "Kodi është i hapët; shihni si funksionon platforma.",
                tone: "bg-info-blue/10 text-info-blue",
              },
              {
                icon: Sparkles,
                title: "Pa gjurmë personale",
                text: "Nuk kërkojmë llogari për të shfletuar materialet.",
                tone: "bg-success-green/10 text-success-green",
              },
              {
                icon: Users,
                title: "Për autorët",
                text: "Kërkesat për heqje të përmbajtjes trajtohen seriozisht.",
                tone: "bg-warning-amber/10 text-warning-amber",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className={`surface-card flex h-full flex-col p-5 md:p-6 hover:border-burgundy-600/30`}
              >
                <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-semibold text-navy-800">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-12 md:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="mx-auto mb-8 max-w-2xl text-center">
            <p className="page-kicker mb-4">Eksploro</p>
            <h2 className="font-display text-3xl font-bold leading-tight text-navy-900 md:text-4xl">
              Çfarë ofron E-Studenti
            </h2>
            <p className="page-subtitle mx-auto mt-3 max-w-xl">
              Shkurtore drejt pjesëve kryesore të platformës.
            </p>
          </motion.div>

          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: "Për Aplikantët",
                text: "Materiale nga studentët e mëparshëm për t'ju ndihmuar të përgatiteni.",
                href: "/per-aplikantet",
                tone: "bg-warning-amber/10 text-warning-amber",
              },
              {
                icon: Building2,
                title: "Fakultetet",
                text: "Informacion dhe materiale sipas fakultetit.",
                href: "/fakultetet",
                tone: "bg-info-blue/10 text-info-blue",
              },
              {
                icon: BookOpen,
                title: "Materialet",
                text: "Katalog i plotë i shënimeve, afateve dhe projekteve.",
                href: "/materialet",
                tone: "bg-success-green/10 text-success-green",
              },
              {
                icon: Link2,
                title: "Burime",
                text: "Lidhje të dobishme të verifikuara nga komuniteti.",
                href: "/burime",
                tone: "bg-navy-100 text-navy-800",
              },
              {
                icon: HelpCircle,
                title: "Rreth nesh & FAQ",
                text: "Misioni, politikat dhe pyetjet e shpeshta.",
                href: "/informacione",
                tone: "bg-burgundy-600/10 text-burgundy-600",
              },
              {
                icon: Upload,
                title: "Dërgo materialin tënd",
                text: "Kontribuo me shënime, afate ose burime për studentët e tjerë.",
                href: "/llogaria/ngarko",
                tone: "bg-burgundy-600/10 text-burgundy-600",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
              >
                <Link
                  href={item.href}
                  className="surface-card flex h-full flex-col border-burgundy-600/10 p-5 transition-colors hover:border-burgundy-600/30 md:p-6"
                >
                  <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-semibold text-navy-800">{item.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                    {item.text}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-burgundy-600">
                    Shiko
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-12 md:py-14 lg:py-16">
        <motion.div
          {...fadeUp}
          className="mx-auto flex max-w-7xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-[#7360f2] p-8 text-center text-white shadow-lg md:flex-row md:justify-between md:p-10 md:text-left"
        >
          <div className="flex flex-col items-center gap-5 md:flex-row">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <ViberIcon className="h-9 w-9" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight text-white md:text-3xl">
                Bashkohu me komunitetin në Viber
              </h2>
              <p className="mt-2 max-w-xl text-white/85">
                Merr njoftimet, afatet dhe materialet e reja direkt në grupin
                tonë.
              </p>
            </div>
          </div>
          <a
            href={VIBER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#7360f2] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus:ring-4 focus:ring-white/40"
          >
            Bashkohu tani
          </a>
        </motion.div>
      </section>
    </div>
  );
}
