"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function LawDetail() {
  const faculty = {
    name: "Fakulteti Juridik",
    code: "LAW",
    description:
      "Fakulteti Juridik siguron një edukim gjithëpërfshirës juridik, duke mbuluar degë të ndryshme të ligjit, teori juridike dhe praktikë, duke përgatitur studentët për karrierë në profesionin juridik.",
    established: "1961",
    location: "Agim Ramadani, Prishtinë",
    email: "juridiku@uni-pr.edu",
    phone: "+383 38 229 063",
    departments: [
      {
        name: "Juridik",
        code: "LAW",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="law" />;
}
