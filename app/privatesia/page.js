export const metadata = {
  title: "Politika e privatësisë",
  description:
    "Politika e privatësisë për E-Studenti: çfarë të dhënash mbledhim, si funksionon postimi anonim, shërbimet e treta dhe të drejtat tuaja.",
  alternates: {
    canonical: "https://e-studenti.com/privatesia",
  },
};

const sections = [
  {
    title: "Kush jemi",
    text: "E-Studenti është një platformë komunitare e ndërtuar nga studentë, jo një shërbim zyrtar i Universitetit të Prishtinës. Nuk kemi monetizim — pa reklama, pa abonime të paguara dhe pa shitje të të dhënave.",
  },
  {
    title: "Çfarë mbledhim",
    text: "Materialet dhe burimet publike mund të shfletohen pa llogari. Kur krijoni llogari, ruajmë emrin, mbiemrin (nëse jepet) dhe emailin për hyrje, verifikim dhe menaxhim të përmbajtjes që dërgoni. Kur ngarkoni materiale ose dërgoni lidhje burimesh, ruajmë metadatat e përmbajtjes, lidhjet e skedarëve/faqeve dhe identitetin e dërguesit (i fshehur publikisht nëse zgjidhni anonimitet).",
  },
  {
    title: "Si funksionon postimi anonim",
    text: "Kur zgjidhni postim anonim për materiale ose lidhje, emri juaj shfaqet publikisht si \"Anonim\" dhe emri real përjashtohet nga kërkimi dhe përgjigjet publike të API-së. Kjo nuk është anonimitet absolut: moderatorët mund ta shohin identitetin real vetëm për moderim, raportime dhe trajtim abuzimi.",
  },
  {
    title: "Lidhjet e jashtme (Burime shtesë)",
    text: "Lidhjet e dërguara në /burime ruhen me URL origjinale dhe të zgjidhura (pas shkurtimeve). Vetëm lidhjet e aprovuara shfaqen publikisht. Ne nuk kontrollojmë përmbajtjen e faqeve të jashtme pas publikimit — përdoruesit njoftohen para se të dalin nga platforma.",
  },
  {
    title: "Shërbimet e treta",
    text: "Përdorim Cloudflare (Workers, D1, R2, Pages) për hostim, ruajtje skedarësh dhe siguri. Email-et e verifikimit dërgohen përmes Resend. Nëse është konfiguruar, Google Safe Browsing mund të kontrollojë URL-të e dërguara për alarme sigurie — vetëm si flamur moderimi, jo bllokim automatik. Statistika të përgjithshme hostimi (vizita, lloji shfletuesi) mund të përdoren për mirëmbajtje.",
  },
  {
    title: "Ruajtja dhe fshirja",
    text: "Të dhënat e llogarisë dhe përmbajtja e ngarkuar ruhen derisa të kërkoni fshirje ose derisa të hiqen për shkelje/kërkesë heqjeje. Për fshirje llogarie ose materialesh, na kontaktoni përmes formularit të kontaktit (subjekti \"Problem teknik\" ose \"Tjetër\") ose në Instagram @estudenti.hub.",
  },
  {
    title: "Pa monetizim / pa shitje të dhënash",
    text: "Aktualisht nuk monetizojmë platformën dhe nuk shesim të dhëna personale te palë të treta. Nëse kjo ndryshon në të ardhmen, politika do të përditësohet para se ndonjë monetizim të hyjë në fuqi.",
  },
  {
    title: "Kontakt për privatësi",
    text: "Për pyetje, kërkesa aksesi ose fshirjeje të dhënash, përdorni formularin e kontaktit te /informacione#kontakt ose shkruani në Instagram: @estudenti.hub.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-shell">
      <div className="section-shell max-w-4xl">
        <header className="mb-10">
          <p className="page-kicker mb-4">Ligjore</p>
          <h1 className="page-title mb-4">Politika e privatësisë</h1>
          <p className="page-subtitle max-w-2xl">
            Si trajtojmë të dhënat tuaja në E-Studenti — thjesht, transparent
            dhe vetëm për funksionimin e platformës.
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