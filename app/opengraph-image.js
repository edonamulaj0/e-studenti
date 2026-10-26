import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "./lib/og-card";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "E-Studenti — materiale studimore për studentët në Kosovë";

export default function Image() {
  return renderOgCard({
    eyebrow: "Nga komuniteti, për çdo student",
    title: "Afate, ligjërata dhe shënime për studentët në Kosovë",
    meta: "Shfletoni falas · Ngarkoni · Kërkoni atë që ju mungon",
  });
}
