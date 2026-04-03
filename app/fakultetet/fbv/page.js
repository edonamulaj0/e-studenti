"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FbvDetail() {
  const faculty = {
    name: "Fakulteti i Bujqësisë dhe Veterinarisë",
    code: "VET",
    description:
      "Fakulteti i Bujqësisë dheVeterinarisë ofron arsim në shkencat bujqësore, mjekësinë veterinare dhe fusha të tjera që mbështesin zhvillimin rural.",
    established: "XXXX",
    location: "Agim Ramadani, Prishtinë",
    email: "fbv@uni-pr.edu",
    phone: "+383 38 603 668",
    departments: [
      {
        name: "Prodhim bimor",
        code: "FBVPB",
        description: "",
      },
      {
        name: "Ekonomia e bujqësisë",
        code: "FBVEB",
        description: "",
      },
      {
        name: "Prodhimtari shtazore",
        code: "FBVPSH",
        description: "",
      },
      {
        name: "Teknologji ushqimore me bioteknologji",
        code: "FBVPSH",
        description: "",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="fbv" />;
}
