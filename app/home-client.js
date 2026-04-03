"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  ExternalLink,
  Shield,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  initial: false,
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2, margin: "0px 0px -8% 0px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export default function HomeClient() {
  return (
    <div className="relative bg-gradient-to-br from-red-50 to-indigo-100">
      <section
        className="flex flex-col justify-center pt-24 pb-14 md:pb-16 px-4 min-h-[min(88vh,780px)]"
      >
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-base md:text-lg font-semibold text-red-700 mb-3 tracking-wide uppercase">
            Studentë për studentë
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.08]">
            E-Studenti
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-snug font-medium">
            Qendra e burimeve jo-zyrtare për studentët e Universitetit të
            Prishtinës — materiale, fakultete dhe lidhje të dobishme.
          </p>

          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/90 p-5 md:p-6 mb-8 text-left shadow-md">
            <p className="text-base md:text-lg text-amber-900 font-semibold leading-relaxed">
              Vërejtje: Kjo faqe është ndërtuar nga studentët për studentët dhe{" "}
              <span className="underline decoration-amber-400">
                nuk ka lidhje zyrtare
              </span>{" "}
              me Universitetin e Prishtinës.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <Link
              href="/materialet"
              className="inline-flex items-center justify-center gap-2 text-lg font-bold bg-red-600 text-white px-10 py-4 rounded-2xl hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-red-600/25 transition-all"
            >
              Shiko materialet
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/fakultetet"
              className="inline-flex items-center justify-center gap-2 text-lg font-bold bg-white text-red-600 px-10 py-4 rounded-2xl border-4 border-red-600 hover:bg-red-50 transition-all"
            >
              Fakultetet
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 px-4 border-t border-white/50"
      >
        <div className="container mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
              Pse E-Studenti?
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              I hapur, i lexueshëm dhe i përditësuar nga komuniteti.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {[
              {
                icon: Shield,
                title: "Transparencë",
                text: "Kodi është i hapët; shihni si funksionon platforma.",
              },
              {
                icon: Sparkles,
                title: "Pa gjurmë personale",
                text: "Nuk kërkojmë llogari për të shfletuar materialet.",
              },
              {
                icon: Users,
                title: "Për autorët",
                text: "Kërkesat për heqje të përmbajtjes trajtohen seriozisht.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl bg-white p-6 shadow-md border-2 border-transparent hover:border-red-100 hover:shadow-lg transition-all"
              >
                <item.icon className="w-10 h-10 text-red-600 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-gray-200/80 pt-10">
            <motion.h3
              {...fadeUp}
              className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-8"
            >
              Qasje e shpejtë
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.04 }}>
                <Link
                  href="/fakultetet"
                  className="block h-full rounded-2xl bg-white p-6 md:p-7 shadow-lg border-2 border-transparent hover:border-red-200 hover:-translate-y-0.5 transition-all group"
                >
                  <BookOpen className="w-11 h-11 text-red-600 mb-4 group-hover:scale-105 transition-transform" />
                  <h4 className="text-xl font-bold mb-2 text-gray-900">
                    Fakultetet
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Lista, departamentet dhe lidhje zyrtare.
                  </p>
                  <span className="inline-flex items-center gap-2 text-base font-bold text-red-600">
                    Eksploro
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </motion.div>

              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
                <Link
                  href="/materialet"
                  className="block h-full rounded-2xl bg-white p-6 md:p-7 shadow-lg border-2 border-transparent hover:border-red-200 hover:-translate-y-0.5 transition-all group"
                >
                  <FileText className="w-11 h-11 text-red-600 mb-4 group-hover:scale-105 transition-transform" />
                  <h4 className="text-xl font-bold mb-2 text-gray-900">
                    Materialet
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Shënime, afate, projekte — me filtra.
                  </p>
                  <span className="inline-flex items-center gap-2 text-base font-bold text-red-600">
                    Shfleto
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </motion.div>

              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }}>
                <div className="h-full rounded-2xl bg-white p-6 md:p-7 shadow-lg border-2 border-indigo-100/80">
                  <ExternalLink className="w-11 h-11 text-indigo-600 mb-4" />
                  <h4 className="text-xl font-bold mb-3 text-gray-900">
                    Lidhje të jashtme
                  </h4>
                  <div className="space-y-2 text-sm md:text-base">
                    <a
                      href="https://uni-pr.edu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-red-600 font-semibold hover:underline"
                    >
                      uni-pr.edu
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="https://fiek.uni-pr.edu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-red-600 font-semibold hover:underline"
                    >
                      FIEK
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Link
                      href="/erasmus"
                      className="flex items-center gap-2 text-red-600 font-semibold hover:underline"
                    >
                      Erasmus+
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 px-4 pb-24">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            {...fadeUp}
            className="text-center mb-8 max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Bashkohu me komunitetin
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Materiale, ide ose pyetje — kontakti dhe GitHub janë hapur për ty.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.06 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            <Link
              href="/kontakto"
              className="inline-flex items-center gap-2 text-base font-bold bg-red-600 text-white px-8 py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
            >
              Na shkruaj
            </Link>
            <a
              href="https://github.com/edonamulaj0/e-studenti"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-base font-bold bg-gray-900 text-white px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-all"
            >
              GitHub
            </a>
            <Link
              href="/informacione"
              className="inline-flex items-center gap-2 text-base font-bold bg-white text-gray-800 px-8 py-3.5 rounded-xl border-2 border-gray-200 hover:border-red-200 transition-all"
            >
              Informacione
            </Link>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="rounded-2xl md:rounded-[1.75rem] bg-gradient-to-br from-red-600 to-red-800 text-white p-8 md:p-10 text-center shadow-2xl shadow-red-900/25 max-w-3xl mx-auto"
          >
            <h3 className="text-2xl md:text-4xl font-extrabold mb-3">
              Gati për semestrin?
            </h3>
            <p className="text-base md:text-lg text-red-100 mb-8 leading-relaxed max-w-lg mx-auto">
              Gjej materialet sipas fakultetit dhe llojit — shpejt dhe pa humbur
              kohë.
            </p>
            <Link
              href="/materialet"
              className="inline-flex items-center gap-2 text-lg font-bold bg-white text-red-700 px-10 py-4 rounded-xl hover:bg-red-50 transition-all"
            >
              Hap koleksionin
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
