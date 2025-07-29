"use client";
import { BookOpen, Users, Mail, Phone, MapPin, Award } from "lucide-react";
import Link from "next/link";

export default function FimDetail() {
  const faculty = {
    name: "Fakulteti i Inxhinierisë Mekanike",
    code: "FIM",
    description:
      "Fakulteti i Inxhinierisë Mekanike ofron arsim në inxhinieri mekanike, inxhinieri industriale dhe disiplina teknike të lidhura me to.",
    established: "1961",
    location: "Agim Ramadani, Prishtinë",
    email: "fim@uni-pr.edu",
    phone: "+381 38 552 126",
    totalDepartments: "5",
    totalStudents: "2770",
    totalTeachers: "XX",
    departments: [
      {
        name: "Prodhimtari dhe Inxhinieri Industriale",
        code: "FIMPII",
        description: "",
      },
      {
        name: "Termoenergjetikë dhe Energji të Ripërtëritshme",
        code: "FIMTER",
        description: "",
      },
      {
        name: "Dizajn inxhinierik dhe Automjete",
        code: "FIMDIA",
        description: "",
      },
      {
        name: "Komunikacion dhe transport",
        code: "FIMKT",
        description: "",
      },
      {
        name: "Mekatronikë",
        code: "FIMMECH",
        description: "",
      },
    ],
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {faculty.name}
              </h1>
              <p className="text-lg text-red-600 font-medium">{faculty.code}</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{faculty.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Studentët Gjithsej</p>
                <p className="font-semibold">{faculty.totalStudents}</p>
              </div>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Profesorët Gjithsej</p>
                <p className="font-semibold">{faculty.totalTeachers}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Themeluar</p>
                <p className="font-semibold">{faculty.established}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Vendndodhja</p>
                <p className="font-semibold text-sm">{faculty.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kontakti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{faculty.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Nr. Tel.</p>
                <p className="font-medium">{faculty.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Departamentet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faculty.departments.map((department, index) => (
              <Link
                key={index}
                href={`/departments/${department.code.toLowerCase()}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {department.name}
                  </h3>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <p>{department.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
