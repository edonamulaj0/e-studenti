export const metadata = {
  title: "Kushtet e shërbimit",
  description:
    "Kushtet e shërbimit për përdorimin e E-Studenti, ngarkimin e materialeve dhe përgjegjësitë e përdoruesve.",
};

const sections = [
  {
    title: "Përdorimi i platformës",
    text: "E-Studenti është platformë komunitare për materiale studimore. Përdoreni për qëllime edukative dhe verifikoni gjithmonë informacionin me burime zyrtare kur është e nevojshme.",
  },
  {
    title: "Ngarkimi i materialeve",
    text: "Duke ngarkuar material, konfirmoni se keni të drejtë ta ndani atë ose se materiali lejohet të shpërndahet për përdorim edukativ. Përmbajtjet e papërshtatshme mund të hiqen.",
  },
  {
    title: "Të drejtat e autorit",
    text: "Respektojmë autorët dhe kërkesat për heqje. Nëse një material shkel të drejtat tuaja, raportojeni përmes formularit ose na shkruani në Instagram: @estudenti.hub.",
  },
  {
    title: "Disponueshmëria",
    text: "Platforma ofrohet pa garanci për disponueshmëri të pandërprerë. Mund të ketë ndryshime, mirëmbajtje ose largim të materialeve kur është e nevojshme.",
  },
  {
    title: "Përgjegjësia",
    text: "Materialet janë kontribute të komunitetit. E-Studenti nuk garanton saktësinë e çdo materiali dhe nuk zëvendëson njoftimet ose dokumentet zyrtare të universitetit.",
  },
];

export default function TermsPage() {
  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-10 max-w-3xl">
          <p className="page-kicker mb-4">Ligjore</p>
          <h1 className="page-title mb-4">Kushtet e shërbimit</h1>
          <p className="page-subtitle max-w-2xl">
            Këto kushte përshkruajnë mënyrën e përdorimit të E-Studenti dhe
            përgjegjësitë bazë për materialet që ndahen në platformë.
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
