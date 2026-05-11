"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Sparkles,
  Users,
  ArrowRight,
  Upload,
} from "lucide-react";

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
        <img
          src="/uplogo.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-10 h-80 w-80 opacity-10 mix-blend-multiply sm:h-[28rem] sm:w-[28rem] lg:right-4 lg:top-16 lg:h-[34rem] lg:w-[34rem]"
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

          <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-gray-400 md:block">
            <span className="block h-10 w-6 rounded-full border border-gray-400/50 p-1">
              <span className="mx-auto block h-2 w-1 rounded-full bg-gray-400 animate-bounce" />
            </span>
          </div>
        </div>
      </section>

      <section className="viewport-section-start">
        <div className="mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="mb-10 max-w-2xl">
            <p className="page-kicker mb-4">Pse ekziston</p>
            <h2 className="font-display text-3xl font-bold leading-tight text-navy-900 md:text-4xl">
              Pse E-Studenti?
            </h2>
            <p className="page-subtitle mt-3">
              I hapur, i lexueshëm dhe i përditësuar nga komuniteti.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
              {
                icon: Upload,
                title: "Dërgo Materialin Tënd",
                text: "Shto materiale direkt nga platforma — kontributi yt ndihmon studentët e tjerë.",
                cta: true,
                tone: "bg-burgundy-600/10 text-burgundy-600",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className={`surface-card p-6 md:p-7 ${
                  item.cta
                    ? "border-burgundy-600/20 bg-burgundy-50"
                    : "hover:border-burgundy-600/30"
                }`}
              >
                <span className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="h-7 w-7" />
                </span>
                <h3 className="text-xl font-semibold text-navy-800">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.text}
                </p>
                {item.cta && (
                  <Link
                    href="/llogaria/ngarko"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-burgundy-600"
                  >
                    Dërgo tani
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
