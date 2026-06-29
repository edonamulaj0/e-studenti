import { FACULTIES } from "../../lib/material-options";
import FacultyClient from "./FacultyClient";

export function generateStaticParams() {
  return FACULTIES.map((f) => ({ faculty: f.code.toLowerCase() }));
}

export default function FacultyAplikantetPage({ params }) {
  const faculty = FACULTIES.find(
    (f) => f.code.toLowerCase() === String(params.faculty || "").toLowerCase()
  );

  if (!faculty) return null;

  return <FacultyClient faculty={faculty} />;
}
