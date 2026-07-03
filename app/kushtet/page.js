export const metadata = {
  title: "Kushtet e shërbimit",
  description:
    "Kushtet e përdorimit të E-Studenti: të drejtat e autorit, heqja e përmbajtjes, lidhjet e jashtme, moderimi dhe përgjegjësia.",
  alternates: {
    canonical: "https://e-studenti.com/kushtet",
  },
};

const sections = [
  {
    title: "Natyra e platformës",
    text: "E-Studenti është platformë komunitare, e ndërtuar nga studentë, pa lidhje zyrtare me Universitetin e Prishtinës. Materialet dhe lidhjet janë përmbajtje e gjeneruar nga përdoruesit — nuk i verifikojmë për saktësi akademike dhe nuk zëvendësojmë burime zyrtare të universitetit.",
  },
  {
    title: "Pa monetizim",
    text: "Aktualisht platforma nuk ka reklama, abonime të paguara apo shitje të dhënash. Nëse monetizimi prezantohet në të ardhmen, këto kushte do të përditësohen para hyrjes në fuqi.",
  },
  {
    title: "Pronësia e përmbajtjes",
    text: "Duke ngarkuar materiale ose dërguar lidhje, konfirmoni se keni të drejtë ta ndani përmbajtjen ose se shpërndarja lejohet për qëllime edukative. Ju mbeteni pronar i përmbajtjes suaj, por na jepni licencë jo-ekskluzive për ta hostuar, shfaqur dhe shpërndarë në kuadër të platformës.",
  },
  {
    title: "Përmbajtje e ndaluar",
    text: "Ndalohet ngarkimi ose dërgimi i përmbajtjes që nuk keni të drejtë ta ndani, materialeve ilegale, malware/phishing, lidhjeve mashtruese, ose përmbajtjes që shkel privatësinë ose incitojnë ngacmim.",
  },
  {
    title: "Heqja e përmbajtjes (takedown)",
    text: "Profesorë, botues, të drejtëmbajtës ose çdo person i prekur mund të kërkojë heqjen e një materiali ose lidhjeje. Përdorni formularin e kontaktit me subjektin \"Raportoj material\" ose na shkruani në @estudenti.hub. Përpjekemi të shqyrtojmë kërkesat sa më shpejt dhe të heqim përmbajtjen që shkel të drejtat ose rregullat.",
  },
  {
    title: "Lidhjet e jashtme",
    text: "Burimet në /burime drejtojnë te faqe të jashtme (Drive, MEGA, faqe kursi etj.). Ne nuk kontrollojmë përmbajtjen e tyre pas aprovimit. Përdoruesit njoftohen para se të dalin nga E-Studenti. Përdorni gjykimin tuaj kur hapni lidhje të jashtme.",
  },
  {
    title: "Moderimi dhe pezullimi",
    text: "Rezervojmë të drejtën të moderojmë, refuzojmë, heqim përmbajtje dhe të pezullojmë llogari që shkelin këto kushte — pa njoftim paraprak kur është e nevojshme për siguri ose ligj.",
  },
  {
    title: "Përgjegjësia",
    text: "Platforma ofrohet \"siç është\". Nuk garantojmë saktësinë e materialeve studimore, disponueshmëri të pandërprerë, ose që lidhjet e jashtme mbeten të sigurta. Përdorimi bëhet në përgjegjësi të përdoruesit.",
  },
];

export default function TermsPage() {
  return (
    <div className="page-shell">
      <div className="section-shell max-w-4xl">
        <header className="mb-10">
          <p className="page-kicker mb-4">Ligjore</p>
          <h1 className="page-title mb-4">Kushtet e shërbimit</h1>
          <p className="page-subtitle max-w-2xl">
            Rregullat bazë për përdorimin e E-Studenti, ngarkimin e materialeve
            dhe dërgimin e lidhjeve burimore.
          </p>
        </header>

        <div className="grid gap-5">
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