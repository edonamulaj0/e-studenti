"use client";

import FacultyDetailLayout from "../faculty-detail-layout";

export default function EkonomikuDetail() {
  const faculty = {
    name: "Fakulteti Ekonomik",
    code: "ECON",
    description:
      "Fakulteti i Ekonomisë ofron programe në ekonomi, administrim biznesi, menaxhim dhe fusha të tjera të lidhura me të, duke i përgatitur studentët për karriera në sektorët e biznesit dhe ekonomisë.",
    established: "1960",
    location: "Agim Ramadani, Prishtinë",
    email: "ekonomiku@uni-pr.edu",
    phone: "+383 38 228 966",
    departments: [
      {
        name: "Banka dhe Financa",
        code: "BF",
        description:
          "Ky program vë theksin në përdorimin e koncepteve ekonomike, financiare, dhe analizave kritike për të zgjidhur probleme ekonomike dhe financiare, në fushën e bankave dhe financave.",
      },
      {
        name: "Menaxhment",
        code: "MGM",
        description:
          "Ky program është i konceptuar t’i shtojë kapacitetet menaxhuese të invidivëde dhe t’i përgatisë menaxherët e rinj të organizatave, në kushtet kur aftësia vendimmarrëse dhe menaxhimi shkojnë përtej pozitave formale.",
      },
      {
        name: "Marketing",
        code: "MKT",
        description:
          "Ky program ka për qellim të përgatisë kuadro që kontribuojnë në progresin e përgjithshëm ekonomik dhe shoqëror të Kosovës dhe më gjerë, për të përparuar dijen globale në fushën e marketingut.",
      },
      {
        name: "Ekonomiks",
        code: "EKN",
        description:
          "Qëllimi i Programit Ekonomiks është të pajisë studentët me aftësitë për zgjidhjen e problemeve, për të mundësuar atyre që të punojnë në mënyrë të pavarur dhe me përgjegjësi në fushat e ardhshme profesionale.",
      },
      {
        name: "Kontabilitet",
        code: "KTB",
        description:
          "Programi i Kontabilitetit ofron një mjedis që i përkushtohet studentëve, që promovon përsosmërinë akademike, ngritjen profesionale dhe personale përmes frymës kolegjiale me sjellje etike dhe profesionale.",
      },
      {
        name: "Ekonomi e aplikuar dhe menaxhment",
        code: "EAM",
        description:
          "Ky Program ofron njohuri të thella mbi teoritë ekonomike dhe një gamë të gjerë të shkathtësive rreth biznesit, çështjeve organizative dhe financimit duke përdorë metoda analitike e dhe kuantitative.",
      },
    ],
  };

  return <FacultyDetailLayout faculty={faculty} materialsQuery="econ" />;
}
