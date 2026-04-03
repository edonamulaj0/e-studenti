"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FefsDetail() {
  const faculty = {
    name: "Fakulteti i Edukimit Fizik dhe i Sportit",
    code: "FEFS",
    description:
      "FEFS ofron programe në edukim fizik, menaxhim sportiv, kineziologji dhe disiplina të lidhura me sportin dhe aktivitetin fizik.",
    established: "XXXX",
    location: "Agim Ramadani, Prishtinë",
    email: "fefs@uni-pr.edu",
    phone: "+381 38 243 747",
    departments: [
      {
        name: "Edukim Fizik dhe Sport",
        code: "FEFS",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="fefs" />;
}
