// The slug rules live in shared/material-slug.mjs so the website and the Worker
// cannot disagree about them.
export {
  slugify,
  facultySlug,
  materialSlugBase,
  assignMaterialSlugs,
  findMaterialBySlug,
} from "../../shared/material-slug.mjs";
