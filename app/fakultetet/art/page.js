"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function ArtetDetail() {
  const faculty = {
    name: "Fakulteti i Arteve",
    code: "ART",
    description:
      "Fakulteti i Arteve ofron programe në artet e bukura, muzikë, dramë dhe disiplina të tjera krijuese, duke nxitur shprehjen artistike dhe zhvillimin kulturor.",
    established: "1973",
    location: "Agim Ramadani, Prishtinë",
    email: "arte@uni-pr.edu",
    phone: "+383 38 247 129",
    departments: [
      {
        name: "Artet e Bukura",
        code: "AB",
        description:
          "Departamenti i Arteve të Bukura, është program studimor më i madhi në Fakultetin e  Arteve me 298 studentë aktivë, 25 profesorë me kohë të plotë, 31 profesorë me kohë të pjesshme nga Universiteti i Prishtinës dhe 13 profesorë ndihmës me kohë të pjesshme.",
      },
      {
        name: "Artet Dramatike",
        code: "DAD",
        description:
          "Departamenti i Arteve Dramatike (DAD) është program studimor në Fakultetin e  Arteve me 250 studentë aktivë, 32 profesorë me kohë të plotë, 1 profesor me kohë të pjesshme nga Universiteti i Prishtinës dhe 20 profesorë ndihmës me kohë të pjesshme dhe 3 profesorë vizitorë.",
      },
      {
        name: "Artet Muzikore",
        code: "AM",
        description:
          "Në Degen e Arteve Muzikore janë të organizuara gjithsej 2 programe studimi në Bachelor dhe 3 programe të studimit në Master që përfshijnë të gjitha specializimet e veçanta përmes specializimeve të ndryshme.",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="art" />;
}
