import Link from "next/link";
import {
  Shield,
  Lock,
  Users,
  Code,
  Mail,
  Github,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

function SectionCard({ icon: Icon, title, children, border = "red" }) {
  const borderCls =
    border === "gray"
      ? "border-gray-200"
      : "border-red-100 hover:border-red-200";
  return (
    <section
      className={`bg-white rounded-2xl shadow-lg p-7 md:p-9 border-2 ${borderCls} transition-colors`}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Icon className="w-6 h-6" aria-hidden />
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function InformacionePage() {
  const contributors = [
    {
      name: "Edona Mulaj",
      faculty: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike",
    },
    { name: "Leart Lama", faculty: "-" },
    { name: "Jeta Mulaj", faculty: "Fakulteti i Mjekësisë" },
    {
      name: "Eriona Ahmeti",
      faculty: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike",
    },
    { name: "Florian Hajredini", faculty: "Fakulteti i Ndërtimtarisë" },
    { name: "Blendi Memaj", faculty: "Fakulteti i Mjekësisë" },
  ];

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100 pb-20">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <header className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Informacione
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Transparencë, privatësi dhe respekt për të drejtat e autorëve.
          </p>
        </header>

        <div className="max-w-3xl mx-auto space-y-8 md:space-y-10">
          <SectionCard icon={Shield} title="Misioni dhe transparenca">
            <div className="text-base md:text-lg text-gray-700 space-y-4 leading-relaxed">
              <p>
                E-Studenti është një platformë e hapur që synon të ndihmojë
                studentët në qasjen në burime edukative, me transparencë dhe
                respekt për autorët.
              </p>
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <h3 className="font-bold text-gray-900 mb-3">Parimet</h3>
                <ul className="space-y-2.5">
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>Transparent</strong> — kodi publik në GitHub
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>Pa mbledhje të dhënash personale</strong> për
                      shfletim
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>Autorët</strong> — heqje e përmbajtjes pas kërkesës
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>Falas</strong> për studentët
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Shield} title="Politika e privatësisë">
            <div className="bg-red-50 rounded-xl p-6 border border-red-100 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">
                Ne nuk mbledhim të dhëna personale për përdorimin e faqes
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  "Asnjë cookie ose gjurmues për llogari",
                  "Nuk kërkohet llogari për të parë materialet",
                  "Nuk ruhen të dhëna personale nga ne për shfletim",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">
                Statistika anonime (p.sh. përmes hostit / analitikës)
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  "Numri i vizitave në nivel të përgjithshëm",
                  "Rajoni gjeografik në nivel vendi (jo vendndodhje e saktë)",
                  "Lloji i shfletuesit për përmirësim të faqes",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-gray-600 text-sm italic leading-relaxed">
                Faqja është statike; nuk ruajmë profil përdoruesi në platformë.
              </p>
            </div>
          </SectionCard>

          <SectionCard icon={Code} title="Të drejtat e autorit">
            <p className="text-gray-700 mb-6 text-base md:text-lg leading-relaxed">
              Respektojmë të drejtat e autorëve dhe krijuesve të përmbajtjes.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <h3 className="font-bold text-gray-900 mb-3">Për autorët</h3>
                <ul className="space-y-2 text-gray-700 text-sm md:text-base">
                  <li>• Kërkesë për heqje — përgjigje sa më shpejt</li>
                  <li>• Heqje pa pyetje të panevojshme</li>
                  <li>• Respekt për kërkesat ligjore</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">Kontakt heqjeje</h3>
                <div className="space-y-3 text-sm md:text-base">
                  <a
                    href="mailto:info@e-studenti.com"
                    className="flex items-center gap-2 text-red-600 font-semibold hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    info@e-studenti.com
                  </a>
                  <a
                    href="https://github.com/edonamulaj0/e-studenti"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-800 font-semibold hover:text-red-600"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MessageSquare className="w-4 h-4" />
                    @estudenti.up
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Users} title="Kontribuesit">
            <p className="text-gray-600 mb-6 italic text-base">
              Faleminderit studentëve dhe profesorëve që kanë ndarë burime.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {contributors.map((c, index) => (
                <div
                  key={index}
                  className="bg-red-50/80 rounded-xl p-4 border border-red-100"
                >
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{c.faculty}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Code} title="Kodi i hapur">
            <div className="space-y-5">
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <h3 className="font-bold text-gray-900 mb-2">Transparencë</h3>
                <ul className="space-y-2 text-gray-700 text-sm md:text-base">
                  <li>• Struktura dhe funksionimi të verifikueshëm nga kodi</li>
                  <li>• Pa funksionalitet të fshehur</li>
                </ul>
              </div>
              <a
                href="https://github.com/edonamulaj0/e-studenti"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 p-5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors group"
              >
                <div>
                  <p className="font-bold text-lg">GitHub</p>
                  <p className="text-sm text-gray-300">Shiko kodin</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </SectionCard>

          <SectionCard icon={Shield} title="Vërejtje dhe kufizime" border="gray">
            <div className="grid md:grid-cols-2 gap-6 text-sm md:text-base text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Përgjegjësia</h3>
                <ul className="space-y-2">
                  <li>• Vetëm për qëllime edukative</li>
                  <li>• Verifikoni saktësinë me burimet zyrtare</li>
                  <li>• Përmbajtja mund të jetë e vjetër</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Përdorimi</h3>
                <ul className="space-y-2">
                  <li>• Respektoni ligjet dhe autorët</li>
                  <li>• Përdorni në mënyrë etike</li>
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Mail} title="Kontakti">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <a
                href="mailto:info@e-studenti.com"
                className="inline-flex items-center gap-2 text-lg font-bold text-red-600 hover:underline"
              >
                <Mail className="w-5 h-5" />
                info@e-studenti.com
              </a>
              <span className="hidden sm:inline text-gray-300">|</span>
              <div className="flex items-center gap-2 text-gray-700">
                <MessageSquare className="w-5 h-5 text-red-500" />
                <span className="font-medium">@estudenti.up</span>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/kontakto"
                className="inline-flex items-center gap-2 font-bold text-white bg-red-600 px-6 py-3 rounded-xl hover:bg-red-700 transition-colors"
              >
                Faqja e kontaktit
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </SectionCard>
        </div>

        <p className="text-center mt-12 text-gray-600 italic max-w-2xl mx-auto text-base">
          Faleminderit që përdorni E-Studenti — së bashku për një komunitet më të
          hapur.
        </p>
      </div>
    </div>
  );
}
