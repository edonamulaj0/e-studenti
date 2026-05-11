export const metadata = {
  title: "Politika e privatësisë",
  description:
    "Politika e privatësisë për E-Studenti: çfarë të dhënash përdoren, pse përdoren dhe si mbrohet privatësia e studentëve.",
};

const sections = [
  {
    title: "Çfarë mbledhim",
    text: "Materialet publike mund të shfletohen pa llogari. Kur krijoni llogari, ruajmë emrin, mbiemrin dhe emailin vetëm për hyrje, verifikim dhe menaxhim të materialeve që ngarkoni.",
  },
  {
    title: "Kodet e verifikimit",
    text: "Kodet dërgohen në email për regjistrim ose hyrje. Në databazë ruhet vetëm versioni i hash-uar i kodit dhe ai skadon pas një periudhe të shkurtër.",
  },
  {
    title: "Materialet dhe kontribuesit",
    text: "Kur ngarkoni material, ruajmë të dhënat e materialit, lidhjen e skedarit dhe emrin e kontribuesit që shfaqet publikisht pranë materialit.",
  },
  {
    title: "Analitika dhe siguria",
    text: "Hostimi dhe shërbimet e sigurisë mund të ofrojnë statistika të përgjithshme, si numri i vizitave ose lloji i shfletuesit. Këto përdoren për mirëmbajtje dhe mbrojtje të platformës.",
  },
  {
    title: "Kontakti",
    text: "Formulari i kontaktit mund të ruajë mesazhin tuaj për shqyrtim. Për përgjigje direkte, përdorni Instagram: @estudenti.hub.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-10 max-w-3xl">
          <p className="page-kicker mb-4">Ligjore</p>
          <h1 className="page-title mb-4">Politika e privatësisë</h1>
          <p className="page-subtitle max-w-2xl">
            Kjo politikë shpjegon si E-Studenti trajton të dhënat në një mënyrë
            të thjeshtë, transparente dhe të kufizuar në funksionimin e platformës.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="surface-card p-6 md:p-7">
              <h2 className="mb-3 text-2xl font-semibold text-navy-900">
                {section.title}
              </h2>
              <p className="leading-relaxed text-gray-600">{section.text}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
