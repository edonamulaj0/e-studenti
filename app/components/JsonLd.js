export const SITE_URL = "https://e-studenti.com";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-Studenti",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-color.svg`,
    description:
      "Platformë komunitare për materiale studimore dhe burime për studentët e Universitetit të Prishtinës.",
    sameAs: ["https://github.com/edonamulaj0/e-studenti"],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "E-Studenti",
    url: SITE_URL,
    description:
      "Materiale, provime dhe burime studimore për studentët e UP-së.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/materialet?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function materialJsonLd(material, { facultyName, studyLevelLabel }) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: material.title,
    description: `${material.type} — ${material.subject} (${facultyName})`,
    learningResourceType: material.type,
    about: {
      "@type": "Thing",
      name: material.subject,
    },
    educationalLevel: studyLevelLabel,
    url: `${SITE_URL}/materialet/${material.slug}`,
    isAccessibleForFree: true,
    inLanguage: "sq",
  };
}

export function faqPageJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Escape so user-controlled strings cannot break out of a <script> tag. */
export function serializeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
