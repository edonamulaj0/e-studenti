import { Shield, Users, Code, Mail, Github, MessageSquare } from "lucide-react";

export default function InformacionePage() {
  const contributors = [
    {
      name: "Edona Mulaj",
      faculty: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike",
    },
    {
      name: "Leart Lama",
      faculty: "-",
    },
    {
      name: "Jeta Mulaj",
      faculty: "Fakulteti i Mjekësisë",
    },
    {
      name: "Eriona Ahmeti",
      faculty: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike",
    },
    {
      name: "Florian Hajredini",
      faculty: "Fakulteti i Ndërtimtarisë",
    },
  ];

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Informacione
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transparenca e plotë, privatësia e garantuar dhe respekti për të
            drejtat e autorëve
          </p>
        </div>

        <div className="max-w-[75ch] mx-auto space-y-12">
          <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Misioni ynë dhe Transparenca
              </h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 mb-4">
                E-Studenti është një platformë e hapur dhe transparente që synon
                të ndihmojë studentët në qasjen në burime edukative. Ne besojmë
                në transparencën e plotë dhe respektimin e të drejtave të
                autorëve.
              </p>
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Parimet tona:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    • <strong>100% transparent</strong> - kodi është publik në
                    GitHub
                  </li>
                  <li>
                    • <strong>Asnjë mbledhje të dhënash</strong> - nuk ruajmë
                    informacione personale
                  </li>
                  <li>
                    • <strong>Respekt për autorët</strong> - heqim përmbajtjen
                    menjëherë pas kërkesës
                  </li>
                  <li>
                    • <strong>Falas dhe i hapur</strong> - gjithmonë do të jetë
                    falas për studentët
                  </li>
                </ul>
              </div>
            </div>
          </section>


                      <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
  <div className="flex items-center mb-6">
    <Shield className="w-6 h-6 text-red-600 mr-3" />
    <h2 className="text-2xl font-bold text-gray-900">
      Politika e Privatësisë
    </h2>
  </div>
  <div className="bg-red-50 p-6 rounded-lg mb-6">
    <h3 className="font-bold text-gray-800 mb-4 text-lg">
      Ne NUK mbledhim asnjë të dhënë personale:
    </h3>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-center">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
        Asnjë cookie ose gjurmues
      </li>
      <li className="flex items-center">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
        Asnjë llogari përdoruesi të nevojshme
      </li>
      <li className="flex items-center">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
        Asnjë informacion personal i ruajtur
      </li>
    </ul>
  </div>
  <div className="bg-gray-50 p-6 rounded-lg">
    <h3 className="font-bold text-gray-800 mb-4 text-lg">
      Çfarë mbledhim (përmes Cloudflare Analytics):
    </h3>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-center">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
        Statistika anonime të vizitave (sa persona vizitojnë faqen)
      </li>
      <li className="flex items-center">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
        Rajoni gjeografik (vetëm nivel vendi, jo vendndodhje të saktë)
      </li>
      <li className="flex items-center">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
        Lloji i shfletuesit (për të përmirësuar përvojën)
      </li>
    </ul>
    <p className="mt-4 text-gray-600 italic">
      Të gjitha të dhënat janë 100% anonime dhe nuk mund të identifikojnë përdorues individualë.
    </p>
  </div>
  <p className="mt-6 text-gray-600 text-center italic">
    Platforma jonë është 100% statike dhe nuk ruan asgjë për përdoruesit.
  </p>
</section>
          
          <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
            <div className="flex items-center mb-6">
              <Code className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Politika e të Drejtave të Autorit
              </h2>
            </div>
            <p className="text-gray-700 mb-6">
              Respektojmë plotësisht të drejtat e autorëve dhe krijuesve të
              përmbajtjes:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Për autorët:
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>
                    • Nëse dëshironi heqjen e përmbajtjes tuaj, na kontaktoni
                    menjëherë
                  </li>
                  <li>• Do të përgjigjemi brenda 24 orëve</li>
                  <li>• Heqja do të bëhet pa pyetje</li>
                  <li>• Respektojmë plotësisht DMCA dhe ligjet</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Kontakti për heqjen:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-700">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>info@e-studenti.com</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Github className="w-4 h-4 mr-2" />
                    <span>GitHub</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span>Instagram: @estudenti.up</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Kontribuesit</h2>
            </div>

            <p className="text-gray-600 mb-6 italic">
              Faleminderit të gjithë studentëve dhe profesorëve që kanë ndarë
              burimet e tyre edukative:
            </p>

            {contributors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contributors.map((contributor, index) => (
                  <div
                    key={index}
                    className="bg-red-50 p-4 rounded-lg border border-red-200"
                  >
                    <h3 className="font-semibold text-gray-800">
                      {contributor.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {contributor.faculty}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 italic">Do të shtohen së shpejti</p>
                <p className="text-sm text-gray-400 mt-2">
                  Nëse keni kontribuar me burime dhe dëshironi të njiheni, na
                  kontaktoni për t'u shtuar në listë.
                </p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
            <div className="flex items-center mb-6">
              <Code className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Kodi i Hapur dhe Transparenca
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Transparenca e Plotë:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    • Çdo student mund të shohë saktësisht si funksionon
                    platforma
                  </li>
                  <li>• Asnjë kod i fshehur ose funksionalitet sekret</li>
                  <li>• Transparent dhe i verifikueshëm nga të gjithë</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    GitHub Repository
                  </h3>
                  <p className="text-sm text-gray-600">Shiko kodin e plotë</p>
                </div>
                <a
                  href="https://github.com/edonamulaj0/e-studenti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Github className="w-4 h-4 mr-2" />
                  Shiko në GitHub
                </a>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Vërejtje dhe Kufizime
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  Përgjegjësia:
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Vetëm për qëllime edukative</li>
                  <li>• Nuk jemi përgjegjës për saktësinë e përmbajtjes</li>
                  <li>• Studentët duhet të verifikojnë informacionin</li>
                  <li>• Përmbajtja mund të jetë e vjetër</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Përdorimi:</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Falas dhe e hapur për të gjithë</li>
                  <li>• Përdoreni në përputhje me ligjet</li>
                  <li>• Respektoni të drejtat e autorëve</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
            <div className="flex items-center mb-6">
              <Mail className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Kontakti</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  Për çdo pyetje ose shqetësim:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">info@e-studenti.com</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="text-sm">@estudenti.up</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <p className="text-gray-600 italic">
            Faleminderit që përdorni E-Studenti! Së bashku po ndërtojmë një
            komunitet më transparent dhe të hapur për arsimin.
          </p>
        </div>
      </div>
    </div>
  );
}
