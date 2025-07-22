"use client";
import { BookOpen, Users, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Faculties() {
  const faculties = [
    {
      name: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike",
      acronym: "FIEK",
      departments: [
        "Inxhinieri Kompjuterike",
        "Elektronikë, Automatikë dhe Robotikë",
        "Teknologji e Informimit dhe e Komunikimit",
        "Elektroenergjetikë",
      ],
      students: "1,200+",
      website: "https://fiek.uni-pr.edu",
      color: "red",
    },
    {
      name: "Fakulteti i Mjekësisë",
      acronym: "MED",
      departments: ["Mjekësi e Përgjithshme", "Stomatologji", "Infermieri"],
      students: "800+",
      website: "https://med.uni-pr.edu",
      color: "red",
    },
    {
      name: "Fakulteti Juridik",
      acronym: "LAW",
      departments: ["Civil Law", "Criminal Law", "International Law"],
      students: "900+",
      website: "https://law.uni-pr.edu",
      color: "green",
    },
    {
      name: "Fakulteti Ekonomik",
      acronym: "ECON",
      departments: ["Business Administration", "Economics", "Finance"],
      students: "1,000+",
      website: "https://econ.uni-pr.edu",
      color: "purple",
    },
    {
      name: "Fakulteti Filologjik",
      acronym: "PHIL",
      departments: ["Psychology", "Sociology", "History", "Literature"],
      students: "700+",
      website: "https://phil.uni-pr.edu",
      color: "indigo",
    },
    {
      name: "Fakulteti i Ndërtimtarisë",
      acronym: "ENG",
      departments: [
        "Civil Engineering",
        "Mechanical Engineering",
        "Architecture",
      ],
      students: "600+",
      website: "https://eng.uni-pr.edu",
      color: "red",
    },
    {
      name: "Fakulteti i Inxhinierisë Mekanike",
      acronym: "MECH",
      departments: [
        "Civil Engineering",
        "Mechanical Engineering",
        "Architecture",
      ],
      students: "600+",
      website: "https://eng.uni-pr.edu",
      color: "red",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      red: "border-red-200 hover:border-red-400 bg-red-50",
      red: "border-red-200 hover:border-red-400 bg-red-50",
      green: "border-green-200 hover:border-green-400 bg-green-50",
      purple: "border-purple-200 hover:border-purple-400 bg-purple-50",
      indigo: "border-indigo-200 hover:border-indigo-400 bg-indigo-50",
      yellow: "border-yellow-200 hover:border-yellow-400 bg-yellow-50",
    };
    return colors[color] || colors.red;
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fakultetet</h1>
          <p className="text-xl text-gray-600">
            Eksploroni të gjitha fakultetet e Universitetit të Prishtinës
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {faculties.map((faculty, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 ${getColorClasses(
                faculty.color
              )}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {faculty.acronym}
                </h3>
                <a
                  href={faculty.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>

              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                {faculty.name}
              </h4>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {faculty.departments.length} Departamentet
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {faculty.students} Studentët
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <h5 className="font-semibold text-gray-700">Departamentet:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {faculty.departments.slice(0, 3).map((dept, idx) => (
                    <li key={idx}>• {dept}</li>
                  ))}
                  {faculty.departments.length > 3 && (
                    <li className="text-gray-500">
                      • And {faculty.departments.length - 3} më shumë...
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/faculties/${faculty.acronym.toLowerCase()}`}
                  className="flex-1 bg-red-600 text-white text-center py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Shiko detajet
                </Link>
                <Link
                  href={`/materials?faculty=${faculty.acronym.toLowerCase()}`}
                  className="flex-1 bg-gray-600 text-white text-center py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Materialet
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
