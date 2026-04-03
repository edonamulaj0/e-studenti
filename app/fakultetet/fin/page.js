"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FinDetail() {
  const faculty = {
    name: "Fakulteti i Ndërtimtarisë",
    code: "FIN",
    description: "",
    established: "1961",
    location: "Agim Ramadani, Prishtinë",
    email: "fin@uni-pr.edu",
    phone: "+383 38 554 899",
    departments: [
      {
        name: "Konstruksione",
        code: "FINKX",
        description: "",
      },
      {
        name: "Hidroteknikë",
        code: "FINHT",
        description: "",
      },
      {
        name: "Gjeodezi",
        code: "FINGJZ",
        description: "",
      },
      {
        name: "Inxhinieri e Ambientit",
        code: "FINIA",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="fin" />;
}
