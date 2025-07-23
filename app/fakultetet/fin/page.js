"use client";
import { BookOpen, Users, Mail, Phone, MapPin, Award } from "lucide-react";
import Link from "next/link";

export default function DepartmentDetail({ params }) {
  const { code } = params;

  // Mock data - you can replace this with real data later
  const departmentData = {
    ce: {
      name: "Computer Engineering",
      faculty: "FIEK",
      code: "CE",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      rating: 4.5,
      students: 400,
      totalTeachers: 12,
      established: "1995",
      location: "Building A, Floor 3",
      email: "ce@uni-pr.edu",
      phone: "+383 38 244 183",
      subjects: [
        {
          name: "Programming Fundamentals",
          code: "CS101",
          credits: 6,
          semester: 1,
        },
        { name: "Data Structures", code: "CS201", credits: 6, semester: 3 },
        { name: "Algorithms", code: "CS301", credits: 6, semester: 5 },
        { name: "Database Systems", code: "CS401", credits: 6, semester: 7 },
        { name: "Web Development", code: "CS205", credits: 4, semester: 4 },
        { name: "Mobile Development", code: "CS405", credits: 4, semester: 8 },
      ],
      teachers: [
        {
          name: "Prof. Dr. John Smith",
          position: "Professor",
          subjects: ["Programming Fundamentals", "Algorithms"],
          rating: 4.7,
          experience: "15 years",
        },
        {
          name: "Dr. Sarah Johnson",
          position: "Associate Professor",
          subjects: ["Data Structures", "Database Systems"],
          rating: 4.5,
          experience: "10 years",
        },
        {
          name: "Dr. Michael Brown",
          position: "Assistant Professor",
          subjects: ["Web Development", "Mobile Development"],
          rating: 4.3,
          experience: "8 years",
        },
        {
          name: "Dr. Emily Davis",
          position: "Lecturer",
          subjects: ["Programming Fundamentals"],
          rating: 4.6,
          experience: "5 years",
        },
      ],
    },
    ee: {
      name: "Electrical Engineering",
      faculty: "FIEK",
      code: "EE",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.",
      rating: 4.3,
      students: 350,
      totalTeachers: 15,
      established: "1992",
      location: "Building B, Floor 2",
      email: "ee@uni-pr.edu",
      phone: "+383 38 244 184",
      subjects: [
        { name: "Circuit Analysis", code: "EE101", credits: 6, semester: 1 },
        { name: "Power Systems", code: "EE301", credits: 6, semester: 5 },
        { name: "Electronics", code: "EE201", credits: 6, semester: 3 },
        { name: "Control Systems", code: "EE401", credits: 6, semester: 7 },
        {
          name: "Digital Signal Processing",
          code: "EE305",
          credits: 4,
          semester: 6,
        },
      ],
      teachers: [
        {
          name: "Prof. Dr. Robert Wilson",
          position: "Professor",
          subjects: ["Circuit Analysis", "Power Systems"],
          rating: 4.4,
          experience: "20 years",
        },
        {
          name: "Dr. Lisa Anderson",
          position: "Associate Professor",
          subjects: ["Electronics", "Control Systems"],
          rating: 4.2,
          experience: "12 years",
        },
        {
          name: "Dr. David Miller",
          position: "Assistant Professor",
          subjects: ["Digital Signal Processing"],
          rating: 4.5,
          experience: "7 years",
        },
      ],
    },
    // Add more departments as needed
  };

  const dept = departmentData[code] || departmentData.ce; // Default to CE if code not found

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {dept.name}
              </h1>
              <p className="text-lg text-red-600 font-medium">
                {dept.faculty} • {dept.code}
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{dept.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Studentët</p>
                <p className="font-semibold">{dept.students}</p>
              </div>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Profesorët</p>
                <p className="font-semibold">{dept.totalTeachers}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Themeluar</p>
                <p className="font-semibold">{dept.established}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Vendndodhja</p>
                <p className="font-semibold text-sm">{dept.location}</p>
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
                <p className="font-medium">{dept.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Nr. Tel.</p>
                <p className="font-medium">{dept.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Lëndët</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dept.subjects.map((subject, index) => (
              <Link
                key={index}
                href={`/subjects/${subject.code.toLowerCase()}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {subject.name}
                  </h3>
                  <span className="text-sm text-red-600 font-medium">
                    {subject.code}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>ECTS: {subject.credits}</span>
                  <span>Semestri: {subject.semester}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
