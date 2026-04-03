"use client";

import { Mail, Send } from "lucide-react";

const MAILTO =
  "mailto:info@e-studenti.com?subject=" +
  encodeURIComponent("Materiale / pyetje — E-Studenti") +
  "&body=" +
  encodeURIComponent(
    "Fakulteti:\nDepartamenti:\nLënda:\nProfesori:\n\nMesazhi juaj:\n"
  );

export default function Kontakto() {
  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100 pb-20">
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-5xl">
        <header className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Na kontaktoni
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Dërgoni materiale, afate ose pyetje — përdorni email-in ose butonin
            më poshtë.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="rounded-2xl border-2 border-red-200 bg-white shadow-lg p-7 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Mail className="w-6 h-6" aria-hidden />
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                Dërgo materiale
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6 text-base md:text-lg">
              Keni shënime, afate ose burime për të ndarë me studentët? Na
              shkruani me sa më shumë detaje.
            </p>

            <div className="rounded-xl bg-red-50 border border-red-100 p-5 mb-6">
              <h3 className="font-bold text-red-900 mb-3">
                Përfshini në email:
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm md:text-base">
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  Fakulteti dhe departamenti
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  Lënda dhe semestri
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  Profesori (nëse përshtatet)
                </li>
              </ul>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Adresa:{" "}
              <a
                href="mailto:info@e-studenti.com"
                className="text-red-600 font-semibold hover:underline"
              >
                info@e-studenti.com
              </a>
            </p>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4">
              <h3 className="text-base font-bold text-white tracking-tight">
                Shembull mesazhi
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                Kopjoni strukturën ose hapni email me shabllon të plotë
              </p>
            </div>

            <div className="p-6 md:p-7 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                  Teksti
                </label>
                <div className="rounded-xl bg-gray-50 border-2 border-gray-100 px-4 py-3 text-sm text-gray-700 font-mono leading-relaxed">
                  info@e-studenti.com
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                  Subjekti (shembull)
                </label>
                <div className="rounded-xl bg-gray-50 border-2 border-gray-100 px-4 py-3 text-sm text-gray-800">
                  FIEK — Kalkulus 1 — afat
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                  Trupi (shembull)
                </label>
                <div className="rounded-xl bg-gray-50 border-2 border-gray-100 px-4 py-4 text-sm text-gray-700 min-h-[120px] leading-relaxed">
                  Lënda: Kalkulus 1
                  <br />
                  Semestri: dimër 2025/26
                  <br />
                  Profesori: …
                  <br />
                  <br />
                  Bashkëngjit skedarin ose lidhjen…
                </div>
              </div>

              <a
                href={MAILTO}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-3.5 text-base font-bold hover:bg-red-700 transition-colors mt-2"
              >
                <Send className="w-5 h-5" />
                Shkruaj në info@e-studenti.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
