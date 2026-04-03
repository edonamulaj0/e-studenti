"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function MjekesiaDetail() {
  const faculty = {
    name: "Fakulteti i Mjekësisë",
    code: "MED",
    description: "",
    established: "1969",
    location: "Agim Ramadani, Prishtinë",
    email: "mjekesia@uni-pr.edu",
    phone: "+383 38 512 221",
    departments: [
      {
        name: "Mjekësi e përgjithshme",
        code: "MEDMP",
        description: "",
      },
      {
        name: "Stomatologji",
        code: "MEDS",
        description: "",
      },
      {
        name: "Farmaci",
        code: "MEDF",
        description: "",
      },
      {
        name: "Fizioterapi",
        code: "MEDFT",
        description: "",
      },
      {
        name: "Infermieri",
        code: "MEDI",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="med" />;
}
