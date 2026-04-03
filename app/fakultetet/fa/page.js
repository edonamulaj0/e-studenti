"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function ArkitekturaDetail() {
  const faculty = {
    name: "Fakulteti i Arkitekturës",
    code: "ARCH",
    description:
      "Fakulteti i Arkitekturës përqendrohet posaçërisht në disiplinat e dizajnit arkitektonik, planifikimit urban dhe dizajnit mjedisor.",
    established: "2019",
    location: "Agim Ramadani, Prishtinë",
    email: "arkitektura@uni-pr.edu",
    phone: "+383 38 224 751",
    departments: [
      {
        name: "Arkitekturë",
        code: "ARKT",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="fa" />;
}
