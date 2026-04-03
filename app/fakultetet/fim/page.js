"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FimDetail() {
  const faculty = {
    name: "Fakulteti i Inxhinierisë Mekanike",
    code: "FIM",
    description:
      "Fakulteti i Inxhinierisë Mekanike ofron arsim në inxhinieri mekanike, inxhinieri industriale dhe disiplina teknike të lidhura me to.",
    established: "1961",
    location: "Agim Ramadani, Prishtinë",
    email: "fim@uni-pr.edu",
    phone: "+381 38 552 126",
    departments: [
      {
        name: "Prodhimtari dhe Inxhinieri Industriale",
        code: "FIMPII",
        description: "",
      },
      {
        name: "Termoenergjetikë dhe Energji të Ripërtëritshme",
        code: "FIMTER",
        description: "",
      },
      {
        name: "Dizajn inxhinierik dhe Automjete",
        code: "FIMDIA",
        description: "",
      },
      {
        name: "Komunikacion dhe transport",
        code: "FIMKT",
        description: "",
      },
      {
        name: "Mekatronikë",
        code: "FIMMECH",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="fim" />;
}
