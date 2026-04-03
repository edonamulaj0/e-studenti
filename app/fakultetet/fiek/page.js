"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FIEKDetail() {
  const faculty = {
    name: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike",
    code: "FIEK",
    description:
      "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike ofron programe në inxhinieri elektrike, inxhinieri kompjuterike, telekomunikacion dhe teknologji informacioni.",
    established: "1961",
    location: "Agim Ramadani, Prishtinë",
    email: "fiek@uni-pr.edu",
    phone: "+383 38 554 896",
    departments: [
      {
        name: "Inxhinieri Kompjuterike dhe Softuerike",
        code: "FIEKIKS",
        description: "",
      },
      {
        name: "Elektronikë, Automatikë dhe Robotikë",
        code: "FIEKEAR",
        description: "",
      },
      {
        name: "Teknologjitë e Informacionit dhe Komunikimit",
        code: "FIEKTIK",
        description: "",
      },
      {
        name: "Elektroenergjetikë",
        code: "FIEKEEN",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="fiek" />;
}
