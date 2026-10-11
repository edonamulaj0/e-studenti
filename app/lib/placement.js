// Which university a material belongs to. The rules live in shared/ so the website
// and the Worker cannot disagree about them.
export { UNIVERSITIES } from "../../shared/universities.mjs";
export {
  isKnownUniversity,
  isValidPlacement,
  universityShort,
  universityName,
  universityTag,
  DEFAULT_UNIVERSITY,
} from "../../shared/placement.mjs";
export { facultiesFor } from "../../shared/material-options.mjs";
