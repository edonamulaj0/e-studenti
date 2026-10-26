import UniversityClient from "./university-client";
import { getUniversity, universities } from "../../lib/directory";

export const dynamicParams = false;

export function generateStaticParams() {
  return universities.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const u = getUniversity(slug);
  if (!u) return { title: "Universiteti nuk u gjet" };
  const name = u.name.replace(/"/g, "");
  return {
    title: `${name} — programet`,
    description: `${u.programmeCount} programe të akredituara në ${name}, nga bachelor deri në doktoraturë.`,
    alternates: { canonical: `https://e-studenti.com/universitetet/${u.slug}` },
  };
}

export default async function UniversityPage({ params }) {
  const { slug } = await params;
  return <UniversityClient slug={slug} />;
}
