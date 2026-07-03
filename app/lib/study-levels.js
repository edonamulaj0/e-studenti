export const STUDY_LEVELS = [
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "Doktoraturë" },
];

const STUDY_LEVEL_LABELS = Object.fromEntries(
  STUDY_LEVELS.map((level) => [level.value, level.label])
);

export function getStudyLevelLabel(value) {
  return STUDY_LEVEL_LABELS[value] || STUDY_LEVELS[0].label;
}

export function isValidStudyLevel(value) {
  return STUDY_LEVELS.some((level) => level.value === value);
}
