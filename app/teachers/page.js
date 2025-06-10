import {
  Star,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Users,
  Award,
  Search,
} from "lucide-react";
import Link from "next/link";

export default function Teachers() {
  const teachers = [
    {
      id: 1,
      name: "Prof. Dr. John Smith",
      position: "Professor",
      department: "Computer Engineering",
      faculty: "FIEK",
      email: "john.smith@uni-pr.edu",
      phone: "+383 38 244 183",
      office: "A-301",
      subjects: [
        "Programming Fundamentals",
        "Algorithms",
        "Software Engineering",
      ],
      rating: 4.7,
      experience: "15 years",
      education: "PhD in Computer Science - MIT",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Specialized in algorithms and software development methodologies.",
      image: null,
      totalRatings: 156,
      officeHours: "Mon-Wed 14:00-16:00",
    },
    {
      id: 2,
      name: "Dr. Sarah Johnson",
      position: "Associate Professor",
      department: "Computer Engineering",
      faculty: "FIEK",
      email: "sarah.johnson@uni-pr.edu",
      phone: "+383 38 244 184",
      office: "A-205",
      subjects: ["Data Structures", "Database Systems", "Web Development"],
      rating: 4.5,
      experience: "10 years",
      education: "PhD in Information Systems - Stanford",
      bio: "Expert in database systems and web technologies. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: null,
      totalRatings: 89,
      officeHours: "Tue-Thu 10:00-12:00",
    },
    {
      id: 3,
      name: "Prof. Dr. Robert Wilson",
      position: "Professor",
      department: "Electrical Engineering",
      faculty: "FIEK",
      email: "robert.wilson@uni-pr.edu",
      phone: "+383 38 244 185",
      office: "B-401",
      subjects: ["Circuit Analysis", "Power Systems", "Electronics"],
      rating: 4.4,
      experience: "20 years",
      education: "PhD in Electrical Engineering - ETH Zurich",
      bio: "Renowned expert in power systems and circuit design. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Has published over 50 research papers in international journals.",
      image: null,
      totalRatings: 203,
      officeHours: "Mon-Fri 13:00-14:00",
    },
    {
      id: 4,
      name: "Dr. Lisa Anderson",
      position: "Associate Professor",
      department: "Electrical Engineering",
      faculty: "FIEK",
      email: "lisa.anderson@uni-pr.edu",
      phone: "+383 38 244 186",
      office: "B-308",
      subjects: ["Control Systems", "Signal Processing", "Microelectronics"],
      rating: 4.2,
      experience: "12 years",
      education: "PhD in Control Engineering - Cambridge",
      bio: "Specializes in advanced control systems and signal processing techniques. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      image: null,
      totalRatings: 67,
      officeHours: "Wed-Fri 15:00-17:00",
    },
    {
      id: 5,
      name: "Prof. Dr. Michael Thompson",
      position: "Professor",
      department: "General Medicine",
      faculty: "MED",
      email: "michael.thompson@uni-pr.edu",
      phone: "+383 38 244 190",
      office: "M-501",
      subjects: ["Anatomy", "Physiology", "Clinical Medicine"],
      rating: 4.8,
      experience: "18 years",
      education: "MD, PhD - Harvard Medical School",
      bio: "Leading medical researcher and clinician. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Active in both teaching and clinical practice at University Clinical Center.",
      image: null,
      totalRatings: 234,
      officeHours: "Mon-Wed 16:00-18:00",
    },
    {
      id: 6,
      name: "Dr. Emily Davis",
      position: "Assistant Professor",
      department: "Psychology",
      faculty: "PHIL",
      email: "emily.davis@uni-pr.edu",
      phone: "+383 38 244 195",
      office: "P-201",
      subjects: [
        "Cognitive Psychology",
        "Research Methods",
        "Social Psychology",
      ],
      rating: 4.6,
      experience: "6 years",
      education: "PhD in Psychology - Oxford",
      bio: "Young and dynamic researcher in cognitive psychology. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      image: null,
      totalRatings: 145,
      officeHours: "Tue-Thu 11:00-13:00",
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
    <div className="pt-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Teachers</h1>
          <p className="text-xl text-gray-600">
            Meet our distinguished faculty members
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teachers by name or subject..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Faculties</option>
              <option value="FIEK">FIEK</option>
              <option value="MED">Medicine</option>
              <option value="PHIL">Philosophy</option>
              <option value="ECON">Economics</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Positions</option>
              <option value="professor">Professor</option>
              <option value="associate">Associate Professor</option>
              <option value="assistant">Assistant Professor</option>
            </select>
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {teacher.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {teacher.name}
                  </h3>
                  <p className="text-blue-600 font-medium">
                    {teacher.position}
                  </p>
                  <p className="text-sm text-gray-600">
                    {teacher.faculty} • {teacher.department}
                  </p>
                  <div className="flex items-center mt-2">
                    {renderStars(teacher.rating)}
                    <span className="ml-2 text-sm text-gray-600">
                      {teacher.rating} ({teacher.totalRatings} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {teacher.bio}
              </p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <Award className="w-4 h-4 text-purple-600 mr-2" />
                  <span className="text-gray-600">{teacher.education}</span>
                </div>
                <div className="flex items-center text-sm">
                  <BookOpen className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-gray-600">
                    {teacher.experience} experience
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-gray-600">
                    Office: {teacher.office}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  Teaches:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects.map((subject, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>{teacher.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>{teacher.phone}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <strong>Office Hours:</strong> {teacher.officeHours}
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/teachers/${teacher.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Profile
                  </Link>
                  <Link
                    href={`/rate-exam?teacher=${teacher.id}`}
                    className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Rate Teacher
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Faculty Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">Total Teachers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">25</div>
              <div className="text-gray-600">Professors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4.5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">12</div>
              <div className="text-gray-600">Faculties</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
