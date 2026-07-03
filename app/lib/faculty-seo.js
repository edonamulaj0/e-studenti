export const FACULTY_SEO = {
  art: {
    title: "Fakulteti i Arteve — Materiale & Kontakt",
    description:
      "Informacion, departamente dhe materiale studimore për studentët e Fakultetit të Arteve të UP-së.",
  },
  econ: {
    title: "Fakulteti Ekonomik — Materiale & Kontakt",
    description:
      "Burime, departamente dhe materiale për studentët e Fakultetit Ekonomik të Universitetit të Prishtinës.",
  },
  edu: {
    title: "Fakulteti i Edukimit — Materiale & Kontakt",
    description:
      "Informacion akademik dhe materiale studimore për Fakultetin e Edukimit të UP-së.",
  },
  fa: {
    title: "Fakulteti i Arkitekturës — Materiale & Kontakt",
    description:
      "Departamente, kontakt dhe materiale për studentët e Fakultetit të Arkitekturës.",
  },
  fbv: {
    title: "Fakulteti i Bujqësisë dhe Veterinarisë — Materiale & Kontakt",
    description:
      "Materiale dhe informacion për studentët e Fakultetit të Bujqësisë dhe Veterinarisë.",
  },
  fefs: {
    title: "Fakulteti i Edukimit Fizik dhe Sportit — Materiale & Kontakt",
    description:
      "Burime studimore dhe informacion për Fakultetin e Edukimit Fizik dhe Sportit.",
  },
  ffl: {
    title: "Fakulteti Filologjik — Materiale & Kontakt",
    description:
      "Materiale, departamente dhe kontakt për studentët e Fakultetit Filologjik të UP-së.",
  },
  ffz: {
    title: "Fakulteti Filozofik — Materiale & Kontakt",
    description:
      "Informacion, departamente dhe materiale studimore për Fakultetin Filozofik të UP-së.",
  },
  fiek: {
    title: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike — Materiale & Kontakt",
    description:
      "Materiale, lëndë dhe burime për studentët e FIEK-ut në Universitetin e Prishtinës.",
  },
  fim: {
    title: "Fakulteti i Inxhinierisë Mekanike — Materiale & Kontakt",
    description:
      "Burime studimore dhe informacion për Fakultetin e Inxhinierisë Mekanike.",
  },
  fin: {
    title: "Fakulteti i Ndërtimtarisë — Materiale & Kontakt",
    description:
      "Materiale dhe informacion për studentët e Fakultetit të Ndërtimtarisë të UP-së.",
  },
  fshmn: {
    title: "Fakulteti i Shkencave Matematike Natyrore — Materiale & Kontakt",
    description:
      "Materiale studimore për studentët e Fakultetit të Shkencave Matematike Natyrore.",
  },
  law: {
    title: "Fakulteti Juridik — Materiale & Kontakt",
    description:
      "Burime, lëndë dhe materiale për studentët e Fakultetit Juridik të UP-së.",
  },
  med: {
    title: "Fakulteti i Mjekësisë — Materiale & Kontakt",
    description:
      "Informacion dhe materiale studimore për studentët e Fakultetit të Mjekësisë.",
  },
};

export function getFacultyMetadata(slug) {
  const seo = FACULTY_SEO[slug];
  if (!seo) return {};
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `https://e-studenti.com/fakultetet/${slug}`,
    },
  };
}
