"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function FilozofikuDetail() {
  const faculty = {
    name: "Fakulteti i Filozofisë",
    code: "PHIL",
    description:
      "Fakulteti i Filozofisë ofron programe në filozofi, psikologji, sociologji dhe disiplina të lidhura me shkencat humane, duke nxitur të menduarit kritik dhe kërkimin në shkencat shoqërore.",
    established: "1961",
    location: "Agim Ramadani, Prishtinë",
    email: "filozofiku@uni-pr.edu",
    phone: "+383 38 224 783",
    departments: [
      { name: "Histori", code: "FFZH", description: "" },
      { name: "Sociologji", code: "FFZS", description: "" },
      { name: "Filozofi", code: "FFZF", description: "" },
      { name: "Psikologji", code: "FFZP", description: "" },
      { name: "Shkenca politike", code: "FFZSP", description: "" },
      { name: "Punë Sociale", code: "FFZPS", description: "" },
      { name: "Antropologji", code: "FFZAP", description: "" },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="ffz" />;
}
