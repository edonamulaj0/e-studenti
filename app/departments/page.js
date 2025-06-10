import { BookOpen, Users, Clock, Star } from "lucide-react";
import Link from "next/link";

export default function Departments() {
  const departments = [
    {
      name: "Computer Engineering",
      faculty: "FIEK",
      code: "CE",
      subjects: ["Programming", "Data Structures", "Algorithms", "Databases"],
      teachers: 12,
      students: 400,
      rating: 4.5,
    },
    {
      name: "Electrical Engineering",
      faculty: "FIEK",
      code: "EE",
      subjects: [
        "Circuit Analysis",
        "Power Systems",
        "Electronics",
        "Control Systems",
      ],
      teachers: 15,
      students: 350,
      rating: 4.3,
    },
    {
      name: "General Medicine",
      faculty: "MED",
      code: "MED",
      subjects: ["Anatomy", "Physiology", "Pathology", "Pharmacology"],
      teachers: 25,
      students: 300,
      rating: 4.7,
    },
    {
      name: "Business Administration",
      faculty: "ECON",
      code: "BA",
      subjects: ["Management", "Marketing", "Finance", "Operations"],
      teachers: 18,
      students: 450,
      rating: 4.2,
    },
    {
      name: "Civil Engineering",
      faculty: "ENG",
      code: "CIV",
      subjects: [
        "Structural Engineering",
        "Geotechnics",
        "Hydraulics",
        "Construction",
      ],
      teachers: 20,
      students: 280,
      rating: 4.4,
    },
    {
      name: "Psychology",
      faculty: "PHIL",
      code: "PSY",
      subjects: [
        "Cognitive Psychology",
        "Social Psychology",
        "Clinical Psychology",
        "Research Methods",
      ],
      teachers: 14,
      students: 320,
      rating: 4.6,
    },
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Departments</h1>
          <p className="text-xl text-gray-600">
            Browse departments across all faculties
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {departments.map((dept, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-red-600 font-medium">
                    {dept.faculty} • {dept.code}
                  </p>
                </div>
                <div className="flex items-center">
                  {renderStars(dept.rating)}
                  <span className="ml-2 text-sm text-gray-600">
                    {dept.rating}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {dept.students} Students
                  </span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {dept.teachers} Teachers
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h5 className="font-semibold text-gray-700 mb-2">
                  Key Subjects:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {dept.subjects.slice(0, 3).map((subject, idx) => (
                    <span
                      key={idx}
                      className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                    >
                      {subject}
                    </span>
                  ))}
                  {dept.subjects.length > 3 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      +{dept.subjects.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/departments/${dept.code.toLowerCase()}`}
                  className="flex-1 bg-red-600 text-white text-center py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  View Details
                </Link>
                <Link
                  href={`/materials?dept=${dept.code.toLowerCase()}`}
                  className="flex-1 bg-gray-600 text-white text-center py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Materials
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
