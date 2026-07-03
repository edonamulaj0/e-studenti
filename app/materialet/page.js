import MaterialsClient from "./materials-client";
import { fetchMaterialsPage } from "../lib/fetch-materials";
import { assignMaterialSlugs } from "../lib/material-slug";
import { getFacultyName } from "../lib/material-options";
import Link from "next/link";

export default async function MaterialsPage() {
  const initialData = await fetchMaterialsPage({ page: 1, limit: 24 });
  const materials = assignMaterialSlugs(initialData?.materials || []);

  return (
    <>
      <noscript>
        <section className="page-shell">
          <div className="section-shell">
            <h1>Materialet</h1>
            <ul>
              {materials.map((material) => (
                <li key={material.id}>
                  <a href={`/materialet/${material.slug}`}>{material.title}</a>
                  {" — "}
                  {getFacultyName(material.faculty)} · {material.subject}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </noscript>
      <MaterialsClient initialData={initialData} />
    </>
  );
}
