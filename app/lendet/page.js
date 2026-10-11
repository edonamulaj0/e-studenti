import SubjectsClient from "./subjects-client";
import { fetchSubjectsForBuild } from "../lib/fetch-materials";

export const metadata = {
  title: "Lëndët",
  description: "Shfletoni materialet sipas lëndës dhe fakultetit: afate, ligjerata, projekte dhe më shumë.",
  alternates: { canonical: "https://e-studenti.com/lendet" },
};

export default async function SubjectsPage() {
  const subjects = await fetchSubjectsForBuild();
  return <SubjectsClient subjects={subjects} />;
}
