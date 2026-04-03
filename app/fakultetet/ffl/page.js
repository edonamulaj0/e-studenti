"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FilologjiaDetail() {
  const faculty = {
    name: "Fakulteti Filologjik",
    code: "FFL",
    description:
      "Fakulteti i Filologjisë i është kushtuar studimit të gjuhës, letërsisë dhe kulturës. Ofron programe të larmishme që mbulojnë gjuhë të ndryshme, teori letrare dhe studime kulturore, duke nxitur të menduarit kritik dhe aftësitë e komunikimit.",
    established: "XXXX",
    location: "Agim Ramadani, Prishtinë",
    email: "filologjia@uni-pr.edu",
    phone: "+381 38 222 970",
    departments: [
      { name: "Gjuhë Shqipe", code: "FLGJSH", description: "" },
      { name: "Letërsi Shqipe", code: "FLLSH", description: "" },
      {
        name: "Gjuhë dhe Letërsi Angleze",
        code: "FLLA",
        description: "",
      },
      {
        name: "Gjuhë dhe Letërsi Gjermane",
        code: "FLLGJ",
        description: "",
      },
      {
        name: "Gjuhë dhe Letërsi Frënge",
        code: "FLLF",
        description: "",
      },
      { name: "Orientalistikë", code: "FLOR", description: "" },
      {
        name: "Gjuhë dhe Letërsi Turke",
        code: "FLLT",
        description: "",
      },
      { name: "Gazetari", code: "FLGZ", description: "" },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="ffl" />;
}
