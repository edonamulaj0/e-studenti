import UniversitiesClient from "./universities-client";

export const metadata = {
  title: "Universitetet",
  description:
    "Universitetet publike dhe private në Kosovë me programet e tyre të akredituara, nga bachelor deri në doktoraturë, dhe mundësi krahasimi.",
  alternates: { canonical: "https://e-studenti.com/universitetet" },
};

export default function UniversitiesPage() {
  return <UniversitiesClient />;
}
