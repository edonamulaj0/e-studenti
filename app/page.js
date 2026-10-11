import HomeClient from "./home-client";
import { fetchMaterialsPage } from "./lib/fetch-materials";
import { getFacultyName } from "./lib/material-options";
import JsonLd, { organizationJsonLd, websiteJsonLd } from "./components/JsonLd";

export const metadata = {
  title: {
    absolute:
      "E-Studenti — Materiale, Provime dhe Burime për Studentët e UP-së",
  },
  description:
    "Platformë komunitare me materiale studimore, afate, ligjërata dhe burime për studentët e Universitetit të Prishtinës. Shfletoni, shkarkoni dhe kontribuoni.",
  alternates: {
    canonical: "https://e-studenti.com",
  },
};

export default async function Home() {
  // Real, recent uploads for the hero card; if the API is unreachable at build
  // time the card is simply omitted.
  const data = await fetchMaterialsPage({ page: 1, limit: 3 });
  const latest = (data?.materials || [])
    .filter((material) => material.slug)
    .map((material) => ({
      id: material.id,
      slug: material.slug,
      title: material.title,
      faculty: getFacultyName(material.faculty),
      subject: material.subject,
    }));

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HomeClient latest={latest} />
    </>
  );
}
