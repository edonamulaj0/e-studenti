import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Filter,
  Download,
  Bell,
  Search,
} from "lucide-react";
import {useState} from "react";
export default function ExamSchedule() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list"); // list or calendar

  const examPeriods = [
    { id: "current", name: "Current Period (June 2025)", active: true },
    { id: "next", name: "Next Period (September 2025)", active: false },
    { id: "winter", name: "Winter Period (January 2026)", active: false },
  ];

  const faculties = [
    { id: "cs", name: "Computer Science" },
    { id: "eng", name: "Engineering" },
    { id: "med", name: "Medicine" },
    { id: "law", name: "Law" },
    { id: "arts", name: "Arts & Humanities" },
    { id: "business", name: "Business Administration" },
  ];

  const semesters = [
    { id: "1", name: "1st Semester" },
    { id: "2", name: "2nd Semester" },
    { id: "3", name: "3rd Semester" },
    { id: "4", name: "4th Semester" },
    { id: "summer", name: "Summer Session" },
  ];

  const examData = [
    {
      id: 1,
      subject: "Advanced Algorithms",
      code: "CS-401",
      faculty: "cs",
      semester: "4",
      date: "2025-06-15",
      time: "09:00",
      duration: "3 hours",
      room: "Hall A-101",
      instructor: "Dr. Sarah Johnson",
      students: 85,
      type: "Final Exam",
    },
    {
      id: 2,
      subject: "Database Systems",
      code: "CS-301",
      faculty: "cs",
      semester: "3",
      date: "2025-06-16",
      time: "14:00",
      duration: "2.5 hours",
      room: "Lab B-205",
      instructor: "Prof. Michael Chen",
      students: 92,
      type: "Practical Exam",
    },
    {
      id: 3,
      subject: "Constitutional Law",
      code: "LAW-201",
      faculty: "law",
      semester: "2",
      date: "2025-06-17",
      time: "10:00",
      duration: "3 hours",
      room: "Auditorium C",
      instructor: "Dr. Emily Roberts",
      students: 156,
      type: "Written Exam",
    },
    {
      id: 4,
      subject: "Organic Chemistry",
      code: "MED-102",
      faculty: "med",
      semester: "1",
      date: "2025-06-18",
      time: "08:30",
      duration: "4 hours",
      room: "Science Hall 301",
      instructor: "Dr. James Wilson",
      students: 203,
      type: "Final Exam",
    },
    {
      id: 5,
      subject: "Financial Management",
      code: "BUS-305",
      faculty: "business",
      semester: "3",
      date: "2025-06-19",
      time: "13:00",
      duration: "2 hours",
      room: "Business Center 105",
      instructor: "Prof. Lisa Anderson",
      students: 134,
      type: "Case Study Exam",
    },
    {
      id: 6,
      subject: "Modern Literature",
      code: "ENG-205",
      faculty: "arts",
      semester: "2",
      date: "2025-06-20",
      time: "11:00",
      duration: "3 hours",
      room: "Arts Building 202",
      instructor: "Dr. Robert Taylor",
      students: 67,
      type: "Essay Exam",
    },
  ];

  const filteredExams = examData.filter((exam) => {
    const matchesFaculty = !selectedFaculty || exam.faculty === selectedFaculty;
    const matchesSemester =
      !selectedSemester || exam.semester === selectedSemester;
    const matchesSearch =
      !searchTerm ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.instructor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFaculty && matchesSemester && matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (date) => {
    const examDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "bg-gray-100 text-gray-600";
    if (diffDays <= 3) return "bg-red-100 text-red-700";
    if (diffDays <= 7) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Calendar className="text-blue-600" size={32} />
                  Exam Schedule
                </h1>
                <p className="mt-2 text-gray-600">
                  View and manage examination schedules across all faculties
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Bell size={18} />
                  Set Reminders
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download size={18} />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selection */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {examPeriods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                {period.name}
                {period.active && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="text-gray-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search subjects, codes, or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Faculty Filter */}
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Faculties</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 py-1 px-3 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex-1 py-1 px-3 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "calendar"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredExams.length}
            </span>{" "}
            of {examData.length} exams
          </div>
          <div className="text-sm text-gray-500">
            Last updated: June 10, 2025 at 2:30 PM
          </div>
        </div>

        {/* Exam List */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="text-blue-600" size={18} />
                            <h3 className="text-xl font-semibold text-gray-900">
                              {exam.subject}
                            </h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md font-mono">
                              {exam.code}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar size={16} />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {formatDate(exam.date)}
                                </div>
                                <div className="text-sm">Date</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock size={16} />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {exam.time} ({exam.duration})
                                </div>
                                <div className="text-sm">Time & Duration</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin size={16} />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {exam.room}
                                </div>
                                <div className="text-sm">Location</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <User size={16} />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {exam.instructor}
                                </div>
                                <div className="text-sm">Instructor</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          exam.date
                        )}`}
                      >
                        {exam.type}
                      </span>
                      <div className="text-right text-sm text-gray-500">
                        <div>{exam.students} students</div>
                        <div>
                          {faculties.find((f) => f.id === exam.faculty)?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Calendar View
              </h3>
              <p className="text-gray-600">
                Calendar view implementation would go here with a proper
                calendar component
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredExams.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No exams found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms to find exams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
