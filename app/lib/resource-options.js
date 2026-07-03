export const RESOURCE_CATEGORIES = [
  { value: "course_site", label: "Faqe kursi" },
  { value: "drive_folder", label: "Google Drive" },
  { value: "mega_nz", label: "MEGA" },
  { value: "other", label: "Të tjera" },
];

const CATEGORY_LABELS = Object.fromEntries(
  RESOURCE_CATEGORIES.map((item) => [item.value, item.label])
);

export function getResourceCategoryLabel(value) {
  return CATEGORY_LABELS[value] || value || "Të tjera";
}
