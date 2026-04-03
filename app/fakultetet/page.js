"use client";
import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Faculties() {
  const faculties = [
    {
      name: "Fakulteti Filozofik",
      acronym: "FFZ",
      departments: [
        "Histori",
        "Sociologji",
        "Filozofi",
        "Psikologji",
        "Shkenca Politike",
        "Punë Sociale",
        "Antropologji",
      ],
      website: "http://filozofiku.uni-pr.edu/",
      color: "indigo",
    },
    {
      name: "Fakulteti i Shkencave Matematike Natyrore",
      acronym: "FSHMN",
      departments: ["Matematikë", "Matematikë", "Kimi", "Biologji", "Gjeografi"],
      website: "http://fshmn.uni-pr.edu/",
      color: "red",
    },
    {
      name: "Fakulteti i Filologjisë",
      acronym: "FFL",
      departments: [
        "Gjuhë Shqipe",
        "Letërsi Shqipe",
        "Gjuhë dhe Letërsi Angleze",
        "Gjuhë dhe Letërsi Gjermane",
        "Gjuhë dhe Letërsi Frënge",
        "Orientalistikë",
        "Gjuhë dhe Letërsi Turke",
        "Gazetari",
      ],
      website: "http://filologjia.uni-pr.edu/",
      color: "green",
    },
    {
      name: "Fakulteti Juridik",
      acronym: "LAW",
      departments: ["Juridik i Përgjithshëm"],
      website: "http://juridiku.uni-pr.edu/",
      color: "red",
    },
    {
      name: "Fakulteti i Ekonomisë",
      acronym: "ECON",
      departments: [
        "Banka dhe Financa",
        "Menaxhment",
        "Marketing",
        "Ekonomiks",
        "Kontabilitet",
        "Ekonomi e aplikuar dhe menaxhment",
      ],
      website: "http://ekonomiku.uni-pr.edu/",
      color: "indigo",
    },
    {
      name: "Fakulteti i Ndërtimtarisë",
      acronym: "FIN",
      departments: [
        "Konstruksione",
        "Hidroteknikë",
        "Gjeodezi",
        "Inxhinieri e Ambientit",
      ],
      website: "http://fin.uni-pr.edu/",
      color: "red",
    },
    {
      name: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike",
      acronym: "FIEK",
      departments: [
        "Inxhinieri Kompjuterike",
        "Elektronikë, Automatikë dhe Robotikë",
        "Teknologji e Informimit dhe e Komunikimit",
        "Elektroenergjetikë",
      ],
      website: "https://fiek.uni-pr.edu",
      color: "green",
    },
    {
      name: "Fakulteti i Mjekësisë",
      acronym: "MED",
      departments: [
        "Mjekësi e Përgjithshme",
        "Stomatologji",
        "Farmaci",
        "Fizioterapi",
        "Infermieri",
      ],
      website: "http://mjekesia.uni-pr.edu/",
      color: "indigo",
    },
    {
      name: "Fakulteti i Arteve",
      acronym: "ART",
      departments: ["Artet e Bukura", "Artet Dramatike", "Artet Muzikore"],
      website: "http://arte.uni-pr.edu/",
      color: "red",
    },
    {
      name: "Fakulteti i Bujqësisë dhe Veterinarisë",
      acronym: "FBV",
      departments: [
        "Prodhim Bimor",
        "Ekonomia e Bujqësisë",
        "Prodhimtari Shtazore",
        "Mjekësi Veterinare",
        "Teknologji Ushqimore me Bioteknologji",
      ],
      website: "http://fbv.uni-pr.edu/",
      color: "green",
    },
    {
      name: "Fakulteti i Edukimit Fizik dhe i Sportit",
      acronym: "FEFS",
      departments: ["Edukim Fizik dhe Sport"],
      website: "http://fefs.uni-pr.edu/",
      color: "indigo",
    },
    {
      name: "Fakulteti i Edukimit",
      acronym: "EDU",
      departments: [
        "Edukimi në Fëmijëri Të Hershme",
        "Edukimi Fillor",
        "Pedagogji e Përgjithshme",
      ],
      website: "http://edukimi.uni-pr.edu/",
      color: "green",
    },
    {
      name: "Fakulteti i Arkitekturës",
      acronym: "FA",
      departments: ["Arkitekturë"],
      website: "http://fa.uni-pr.edu/",
      color: "red",
    },
    {
      name: "Fakulteti i Inxhinierisë Mekanike",
      acronym: "FIM",
      departments: [
        "Prodhimtari dhe Inxhinieri Industriale",
        "Termoenergjetikë dhe Energji të Ripërtëritshme",
        "Dizajn inxhinierik dhe Automjete",
        "Komunikacion dhe transport",
        "Mekatronikë",
      ],
      website: "http://fim.uni-pr.edu/",
      color: "red",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      red: "border-red-200 hover:border-red-400 bg-red-50/60",
      green: "border-emerald-200 hover:border-emerald-400 bg-emerald-50/50",
      purple: "border-purple-200 hover:border-purple-400 bg-purple-50/50",
      indigo: "border-indigo-200 hover:border-indigo-400 bg-indigo-50/50",
      yellow: "border-amber-200 hover:border-amber-400 bg-amber-50/50",
    };
    return colors[color] || colors.red;
  };

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100 pb-20">
      <div className="container mx-auto px-4 max-w-6xl py-10 md:py-12">
        <header className="text-center mb-12 md:mb-14 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Fakultetet
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Eksploroni fakultetet e Universitetit të Prishtinës — departamente,
            lidhje zyrtare dhe materiale.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {faculties.map((faculty, index) => (
            <article
              key={index}
              className={`flex flex-col h-full bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 md:p-7 border-2 transition-all duration-300 hover:-translate-y-0.5 ${getColorClasses(
                faculty.color
              )}`}
            >
              <div className="flex flex-1 flex-col min-h-0">
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="text-2xl font-black text-red-600 tracking-tight">
                  {faculty.acronym}
                </span>
                <a
                  href={faculty.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                  aria-label={`Faqja e ${faculty.acronym}`}
                >
                  <ExternalLink className="w-6 h-6" />
                </a>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-5 leading-snug">
                {faculty.name}
              </h2>

              <div className="space-y-3 mb-5 text-base text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="font-medium">
                    {faculty.departments.length} departamente
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide text-red-800/80">
                  Departamentet
                </h3>
                <ul className="text-sm md:text-base text-gray-600 space-y-1.5">
                  {faculty.departments.slice(0, 3).map((dept, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>{dept}</span>
                    </li>
                  ))}
                  {faculty.departments.length > 3 && (
                    <li className="text-gray-500 pl-4">
                      +{faculty.departments.length - 3} të tjerë…
                    </li>
                  )}
                </ul>
              </div>
              </div>

              <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-3 shrink-0 border-t border-gray-100/80">
                <Link
                  href={`/fakultetet/${faculty.acronym.toLowerCase()}`}
                  className="flex-1 text-center bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors text-base font-bold shadow-md shadow-red-600/20"
                >
                  Shiko detajet
                </Link>
                <Link
                  href={`/materialet?faculty=${faculty.acronym.toLowerCase()}`}
                  className="flex-1 text-center bg-gray-800 text-white py-3 px-4 rounded-xl hover:bg-gray-900 transition-colors text-base font-bold"
                >
                  Materialet
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
