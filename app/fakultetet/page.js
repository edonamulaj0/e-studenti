"use client";
import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

const accents = [
  "from-info-blue/10 to-white",
  "from-burgundy-50 to-white",
  "from-success-green/10 to-white",
  "from-warning-amber/10 to-white",
];

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

  return (
    <div className="page-shell">
      <div className="section-shell">
        <div className="mb-8 flex items-center gap-2 text-sm font-semibold text-gray-400">
          <Link href="/" className="hover:text-burgundy-600">
            Ballina
          </Link>
          <span>/</span>
          <span className="text-navy-800">Fakultetet</span>
        </div>

        <header className="mb-12 max-w-3xl">
          <p className="page-kicker mb-4">Universiteti i Prishtinës</p>
          <h1 className="page-title mb-4">
            Fakultetet
          </h1>
          <p className="page-subtitle max-w-2xl">
            Eksploroni fakultetet e Universitetit të Prishtinës — departamente,
            lidhje zyrtare dhe materiale.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {faculties.map((faculty, index) => (
            <article
              key={index}
              className={`group relative flex min-h-[23rem] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br ${accents[index % accents.length]} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-burgundy-600/30 hover:shadow-md`}
            >
              <Link
                href={`/fakultetet/${faculty.acronym.toLowerCase()}`}
                className="absolute inset-0 z-0"
                aria-label={`Eksploro ${faculty.name}`}
              />
              <div className="flex flex-1 flex-col min-h-0">
              <div className="relative z-10 mb-6 flex items-start justify-between gap-3">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-bold tracking-wide text-burgundy-600 shadow-sm">
                  {faculty.acronym}
                </span>
                <a
                  href={faculty.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-20 shrink-0 rounded-xl bg-white/70 p-2 text-burgundy-600 transition-colors hover:bg-white"
                  aria-label={`Faqja e ${faculty.acronym}`}
                >
                  <ExternalLink className="w-6 h-6" />
                </a>
              </div>

              <h2 className="relative z-10 mb-5 text-xl font-semibold leading-snug text-navy-900">
                {faculty.name}
              </h2>

              <div className="relative z-10 mb-5 text-base text-gray-600">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
                  <BookOpen className="w-5 h-5 text-success-green shrink-0" />
                  <span className="font-semibold">
                    {faculty.departments.length} departamente
                  </span>
                </div>
              </div>

              <div className="relative z-10 mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Departamentet
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {faculty.departments.slice(0, 3).map((dept, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy-600" />
                      <span>{dept}</span>
                    </li>
                  ))}
                  {faculty.departments.length > 3 && (
                    <li className="font-semibold text-burgundy-600">
                      +{faculty.departments.length - 3} më shumë
                    </li>
                  )}
                </ul>
              </div>
              </div>

              <div className="relative z-10 mt-auto flex items-center justify-between border-t border-gray-200/70 pt-5">
                <span className="text-sm font-semibold text-gray-400">
                  {faculty.departments.length} programe
                </span>
                <span className="btn-primary min-h-[42px] px-4 py-2 group-hover:bg-burgundy-500">
                  Eksploro
                  <ExternalLink className="h-4 w-4" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
