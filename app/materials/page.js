"use client";
import { useState } from "react";
import { FileText, Download, Eye, Star, Filter, Search } from "lucide-react";

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const materials = [
    {
      title: "Data Structures and Algorithms - Lecture Notes",
      faculty: "FIEK",
      department: "Computer Engineering",
      type: "Lecture Notes",
      subject: "Data Structures",
      semester: "Fall 2024",
      teacher: "Prof. Smith",
      rating: 4.8,
      downloads: 245,
      uploadDate: "2024-01-15",
    },
    {
      title: "Circuit Analysis - Past Exam Solutions",
      faculty: "FIEK",
      department: "Electrical Engineering",
      type: "Exam Solutions",
      subject: "Circuit Analysis",
      semester: "Spring 2024",
      teacher: "Prof. Johnson",
      rating: 4.6,
      downloads: 189,
      uploadDate: "2024-01-10",
    },
    {
      title: "Anatomy Atlas - Study Guide",
      faculty: "MED",
      department: "General Medicine",
      type: "Study Guide",
      subject: "Anatomy",
      semester: "Fall 2024",
      teacher: "Dr. Williams",
      rating: 4.9,
      downloads: 312,
      uploadDate: "2024-01-20",
    },
    {
      title: "Financial Management - Case Studies",
      faculty: "ECON",
      department: "Business Administration",
      type: "Case Studies",
      subject: "Financial Management",
      semester: "Spring 2024",
      teacher: "Prof. Brown",
      rating: 4.4,
      downloads: 156,
      uploadDate: "2024-01-12",
    },
    {
      title: "Structural Engineering - Project Examples",
      faculty: "ENG",
      department: "Civil Engineering",
      type: "Projects",
      subject: "Structural Engineering",
      semester: "Fall 2024",
      teacher: "Prof. Davis",
      rating: 4.7,
      downloads: 198,
      uploadDate: "2024-01-18",
    },
  ];

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty =
      selectedFaculty === "" || material.faculty === selectedFaculty;
    const matchesType = selectedType === "" || material.type === selectedType;

    return matchesSearch && matchesFaculty && matchesType;
  });

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
    <div className="pt-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Study Materials
          </h1>
          <p className="text-xl text-gray-600">
            Access lecture notes, past exams, and study resources
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Faculties</option>
              <option value="FIEK">FIEK</option>
              <option value="MED">Medicine</option>
              <option value="ECON">Economics</option>
              <option value="ENG">Engineering</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Lecture Notes">Lecture Notes</option>
              <option value="Exam Solutions">Exam Solutions</option>
              <option value="Study Guide">Study Guides</option>
              <option value="Case Studies">Case Studies</option>
              <option value="Projects">Projects</option>
            </select>

            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMaterials.map((material, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {material.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {material.faculty}
                    </span>
                    <span>{material.department}</span>
                  </div>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subject:</span>
                  <span className="text-sm font-medium">
                    {material.subject}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium">{material.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Teacher:</span>
                  <span className="text-sm font-medium">
                    {material.teacher}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Semester:</span>
                  <span className="text-sm font-medium">
                    {material.semester}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {renderStars(material.rating)}
                  <span className="ml-2 text-sm text-gray-600">
                    {material.rating}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Download className="w-4 h-4 mr-1" />
                  <span>{material.downloads} downloads</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No materials found
            </h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
