// app/faculties/filologjia/page.js (Example for Filologjia)
"use client";
import { BookOpen, Users, Mail, Phone, MapPin, Award } from "lucide-react";
import Link from "next/link";

export default function FilologjiaDetail() {
  // Renamed to be specific for Filologjia
  // Filologjia's specific data
  const faculty = {
    name: "Faculty of Philology",
    code: "FIL",
    description:
      "The Faculty of Philology is dedicated to the study of language, literature, and culture. It offers diverse programs covering various languages, literary theories, and cultural studies, fostering critical thinking and communication skills.",
    established: "1960",
    location: "Main Campus, Building D",
    email: "filologjia@uni-pr.edu",
    phone: "+383 38 244 101",
    totalDepartments: 3,
    totalStudents: 1200,
    totalTeachers: 80,
    departments: [
      {
        name: "Albanian Language and Literature",
        code: "ALL",
        students: 500,
        teachers: 30,
        description: "Study of Albanian language, literature, and culture.",
      },
      {
        name: "English Language and Literature",
        code: "ELL",
        students: 400,
        teachers: 25,
        description: "Study of English language, literature, and linguistics.",
      },
      {
        name: "German Language and Literature",
        code: "GLL",
        students: 300,
        teachers: 25,
        description: "Study of German language, literature, and culture.",
      },
    ],
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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

        {/* Contact Information */}
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

        {/* Departments */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Departamentet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faculty.departments.map((department, index) => (
              <Link
                key={index}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {department.name}
                  </h3>
                  <span className="text-sm text-red-600 font-medium">
                    {department.code}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <p>{department.description}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Studentët: {department.students}</span>
                  <span>Profesorët: {department.teachers}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
