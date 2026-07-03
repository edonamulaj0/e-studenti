import Link from "next/link";
import JsonLd, { faqPageJsonLd } from "../../components/JsonLd";
import { FAQ_ITEMS } from "../../lib/faq-content";

export const metadata = {
  title: "Pyetje të shpeshta",
  description:
    "Përgjigje për pyetjet më të shpeshta rreth E-Studenti: ngarkimi, anonimiteti, llogaria, raportimet dhe privatësia.",
  alternates: {
    canonical: "https://e-studenti.com/rreth-nesh/pyetje-te-shpeshta",
  },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FAQ_ITEMS)} />
      <div className="page-shell">
        <div className="section-shell max-w-3xl">
          <header className="mb-10">
            <p className="page-kicker mb-4">Rreth nesh · Ndihmë</p>
            <h1 className="page-title mb-4">Pyetje të shpeshta</h1>
            <p className="page-subtitle">
              Gjithçka që duhet të dini për përdorimin e E-Studenti, ngarkimin e
              materialeve dhe mbrojtjen e privatësisë.
            </p>
          </header>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="surface-card group p-5 md:p-6"
              >
                <summary className="cursor-pointer list-none font-semibold text-navy-900 marker:content-none">
                  <span className="flex items-start justify-between gap-4">
                    {item.question}
                    <span className="text-burgundy-600 transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-sm text-gray-500">
            Nuk gjetët përgjigjen?{" "}
            <Link href="/informacione#kontakt" className="font-semibold text-burgundy-600">
              Na kontaktoni
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
