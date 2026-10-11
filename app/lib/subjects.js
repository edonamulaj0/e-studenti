// Subject identity and URL rules live in shared/subjects.mjs so the website and
// the Worker cannot disagree about them.
export {
  subjectKey,
  subjectSlug,
  isRealSubject,
  normalizeSubjectName,
  typeRank,
  SUBJECT_TYPE_ORDER,
} from "../../shared/subjects.mjs";
