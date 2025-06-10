import {
  BookOpen,
  Users,
  Clock,
  Star,
  Mail,
  Phone,
  MapPin,
  Award,
} from "lucide-react";
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
            <div className="flex items-center">
              {renderStars(dept.rating)}
              <span className="ml-2 text-lg font-semibold text-gray-700">
                {dept.rating}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{dept.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Students</p>
                <p className="font-semibold">{dept.students}</p>
              </div>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Teachers</p>
                <p className="font-semibold">{dept.totalTeachers}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Established</p>
                <p className="font-semibold">{dept.established}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold text-sm">{dept.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Contact Information
          </h2>
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
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{dept.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Subjects</h2>
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
                  <span>Credits: {subject.credits}</span>
                  <span>Semester: {subject.semester}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Teaching Staff
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dept.teachers.map((teacher, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {teacher.name}
                    </h3>
                    <p className="text-sm text-red-600">{teacher.position}</p>
                  </div>
                  <div className="flex items-center">
                    {renderStars(teacher.rating)}
                    <span className="ml-1 text-sm text-gray-600">
                      {teacher.rating}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Experience: {teacher.experience}
                </p>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Teaches:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating & Comments Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Rate & Comment
          </h2>

          {/* Rating */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Rate this department:
            </p>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors"
                />
              ))}
            </div>
          </div>

          {/* Comment Form */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave a comment:
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="4"
              placeholder="Share your experience with this department..."
            ></textarea>
            <button className="mt-3 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Submit Comment
            </button>
          </div>

          {/* Sample Comments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Comments
            </h3>

            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  JS
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">John Student</p>
                  <div className="flex items-center">
                    {renderStars(4)}
                    <span className="ml-2 text-sm text-gray-600">
                      2 days ago
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Great
                department with knowledgeable professors and well-structured
                curriculum.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  MS
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Maria Smith</p>
                  <div className="flex items-center">
                    {renderStars(5)}
                    <span className="ml-2 text-sm text-gray-600">
                      1 week ago
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">
                Excellent facilities and supportive faculty. The practical
                approach to learning really helps in understanding complex
                concepts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
