import { STUDY_LEVELS } from "../../shared/material-options.mjs";

export { STUDY_LEVELS };

const STUDY_LEVEL_LABELS = Object.fromEntries(
  STUDY_LEVELS.map((level) => [level.value, level.label])
);

export function getStudyLevelLabel(value) {
  return STUDY_LEVEL_LABELS[value] || STUDY_LEVELS[0].label;
}
