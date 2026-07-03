import BurimeClient from "./burime-client";
import { fetchResourceLinksPage } from "../lib/fetch-resources";
import { getFacultyName } from "../lib/material-options";
import { getResourceCategoryLabel } from "../lib/resource-options";

export default async function BurimePage() {
  const initialData = await fetchResourceLinksPage({ page: 1, limit: 24 });
  const links = initialData?.links || [];

  return (
    <>
      <noscript>
        <section className="page-shell">
          <div className="section-shell">
            <h1>Burime shtesë</h1>
            <ul>
              {links.map((link) => (
                <li key={link.id}>
                  {link.title} — {getFacultyName(link.faculty)} ·{" "}
                  {getResourceCategoryLabel(link.category)} · {link.resolved_domain}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </noscript>
      <BurimeClient initialData={initialData} />
    </>
  );
}
