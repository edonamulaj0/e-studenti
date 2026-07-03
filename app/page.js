import HomeClient from "./home-client";
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

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HomeClient />
    </>
  );
}
