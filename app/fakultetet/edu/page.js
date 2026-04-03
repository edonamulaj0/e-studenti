"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function EdukimiDetail() {
  const faculty = {
    name: "Fakulteti i Edukimit",
    code: "EDU",
    description:
      "Fakulteti i Edukimit ofron programe trajnimi për mësues dhe edukative, duke përgatitur edukatorë për nivele të ndryshme të sistemit arsimor.",
    established: "2002",
    location: "Agim Ramadani, Prishtinë",
    email: "edukimi@uni-pr.edu",
    phone: "+383 38 229 201",
    departments: [
      {
        name: "Edukimi në Fëmijëri të Hershme (0-6 vjeç)",
        code: "EFH",
        description:
          "Qëllimi kryesor i programit është përgatitja e edukatorëve të ardhshëm të cilët do të jenë kompetentë në punën profesionale në fëmijëri të hershme",
      },
      {
        name: "Edukimi Fillor",
        code: "EF",
        description:
          "Programi synon të pajisë studentët me njohuritë e përmbajtjes kurrikulare për nivelin e dhënë",
      },
      {
        name: "Pedagogji e Përgjithshme",
        code: "PGP",
        description:
          "Ky program synon arsimin bazë pedagogjik me fokus në lëndët që trajtojnë aspekte teorike dhe praktike në sferat pedagogjike, sociale dhe kulturore",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="edu" />;
}
