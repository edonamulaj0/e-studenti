import UniversityClient from "./university-client";
import { getUniversity, universities } from "../../lib/directory";

export const dynamicParams = false;

export function generateStaticParams() {
  return universities.map((u) => ({ slug: u.slug }));
}

export function generateMetadata({ params }) {
  const u = getUniversity(params.slug);
  if (!u) return { title: "Universiteti nuk u gjet" };
  const name = u.name.replace(/"/g, "");
  return {
    title: `${name} — programet`,
    description: `${u.programmeCount} programe të akredituara në ${name}, nga bachelor deri në doktoraturë.`,
    alternates: { canonical: `https://e-studenti.com/universitetet/${u.slug}` },
  };
}

export default function UniversityPage({ params }) {
  return <UniversityClient slug={params.slug} />;
}
