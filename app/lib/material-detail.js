/**
 * Shapes a material from the public API for the detail view. Anonymous uploads
 * never expose a name (the API already omits it; this keeps the rule in one place).
 */
export function prepareMaterial(raw, slug) {
  if (!raw) return null;
  const isAnonymous = Boolean(raw.is_anonymous);
  return {
    ...raw,
    slug,
    uploader_name: isAnonymous ? undefined : raw.uploader_name,
    display_uploader: isAnonymous ? "Anonim" : raw.uploader_name || "—",
  };
}
