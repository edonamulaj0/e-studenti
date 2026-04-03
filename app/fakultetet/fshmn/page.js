"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FshmnDetail() {
  const faculty = {
    name: "Fakulteti i Shkencave Matematikore dhe Natyrore",
    code: "FSHMN",
    description:
      "Fakulteti i Shkencave Matematikore dhe Natyrore siguron arsim dhe hulumtim në matematikë, fizikë, kimi, biologji dhe disiplina shkencore të lidhura.",
    established: "XXXX",
    location: "Agim Ramadani, Prishtinë",
    email: "fshmn@uni-pr.edu",
    phone: "+383 38 249 872",
    departments: [
      { name: "Matematikë", code: "FSHMNM", description: "" },
      { name: "Fizikë", code: "FSHMNF", description: "" },
      { name: "Kimi", code: "FSHMNK", description: "" },
      { name: "Biologji", code: "FSHMNB", description: "" },
      { name: "Gjeografi", code: "FSHMNG", description: "" },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="fshmn" />;
}
