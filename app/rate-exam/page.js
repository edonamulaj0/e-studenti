import {
  Star,
  BookOpen,
  Clock,
  User,
  Calendar,
  Award,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

export default function RateExam() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [examType, setExamType] = useState("");
  const [examDate, setExamDate] = useState("");
  const [ratings, setRatings] = useState({
    difficulty: 0,
    fairness: 0,
    clarity: 0,
    overall: 0,
  });
  const [comment, setComment] = useState("");

  const subjects = [
    {
      code: "CS101",
      name: "Programming Fundamentals",
      department: "Computer Engineering",
    },
    {
      code: "CS201",
      name: "Data Structures",
      department: "Computer Engineering",
    },
    {
      code: "EE101",
      name: "Circuit Analysis",
      department: "Electrical Engineering",
    },
    { code: "MED101", name: "Anatomy", department: "Medicine" },
    { code: "PSY101", name: "General Psychology", department: "Psychology" },
  ];

  const teachers = [
    { id: 1, name: "Prof. Dr. John Smith", department: "Computer Engineering" },
    { id: 2, name: "Dr. Sarah Johnson", department: "Computer Engineering" },
    {
      id: 3,
      name: "Prof. Dr. Robert Wilson",
      department: "Electrical Engineering",
    },
    { id: 4, name: "Dr. Michael Thompson", department: "Medicine" },
    { id: 5, name: "Dr. Emily Davis", department: "Psychology" },
  ];

  const recentRatings = [
    {
      id: 1,
      subject: "Programming Fundamentals",
      teacher: "Prof. Dr. John Smith",
      examType: "Final Exam",
      date: "June 2024",
      ratings: { difficulty: 4, fairness: 5, clarity: 4, overall: 4 },
      comment:
        "Fair exam with clear questions. Time was sufficient to complete all problems.",
      studentName: "Anonymous Student",
      timeAgo: "2 days ago",
    },
    {
      id: 2,
      subject: "Data Structures",
      teacher: "Dr. Sarah Johnson",
      examType: "Midterm",
      date: "April 2024",
      ratings: { difficulty: 5, fairness: 3, clarity: 4, overall: 4 },
      comment:
        "Very challenging exam. Some questions were not covered well in lectures.",
      studentName: "Anonymous Student",
      timeAgo: "1 week ago",
    },
    {
      id: 3,
      subject: "Circuit Analysis",
      teacher: "Prof. Dr. Robert Wilson",
      examType: "Final Exam",
      date: "May 2024",
      ratings: { difficulty: 3, fairness: 5, clarity: 5, overall: 4 },
      comment:
        "Well-structured exam that tested our understanding rather than memorization.",
      studentName: "Anonymous Student",
      timeAgo: "3 weeks ago",
    },
  ];

  const handleRatingClick = (category, rating) => {
    setRatings((prev) => ({
      ...prev,
      [category]: rating,
    }));
  };

  const renderStars = (rating, interactive = false, category = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 hover:text-yellow-400"
          }`}
          onClick={
            interactive ? () => handleRatingClick(category, i) : undefined
          }
        />
      );
    }
    return stars;
  };

  const renderSmallStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    alert("Thank you for your rating! Your feedback helps other students.");
    // Reset form
    setSelectedSubject("");
    setSelectedTeacher("");
    setExamType("");
    setExamDate("");
    setRatings({ difficulty: 0, fairness: 0, clarity: 0, overall: 0 });
    setComment("");
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Rate Exams</h1>
          <p className="text-xl text-gray-600">
            Help fellow students by sharing your exam experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Submit Exam Rating
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.code} value={subject.code}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher *
                  </label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exam Type and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exam Type *
                    </label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select exam type</option>
                      <option value="midterm">Midterm Exam</option>
                      <option value="final">Final Exam</option>
                      <option value="quiz">Quiz</option>
                      <option value="practical">Practical Exam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exam Date *
                    </label>
                    <input
                      type="month"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Rating Categories */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Rate the Exam
                  </h3>

                  {/* Difficulty */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Difficulty</h4>
                      <p className="text-sm text-gray-600">
                        How challenging was the exam?
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(ratings.difficulty, true, "difficulty")}
                    </div>
                  </div>

                  {/* Fairness */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Fairness</h4>
                      <p className="text-sm text-gray-600">
                        Was the exam content fair based on lectures?
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(ratings.fairness, true, "fairness")}
                    </div>
                  </div>

                  {/* Clarity */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Clarity</h4>
                      <p className="text-sm text-gray-600">
                        How clear were the questions?
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(ratings.clarity, true, "clarity")}
                    </div>
                  </div>

                  {/* Overall */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Overall Experience
                      </h4>
                      <p className="text-sm text-gray-600">
                        Your overall rating of the exam
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(ratings.overall, true, "overall")}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share any additional thoughts about the exam..."
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Submit Rating
                </button>
              </form>
            </div>
          </div>

          {/* Recent Ratings Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rating Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Ratings</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-semibold text-green-600">+87</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Difficulty</span>
                  <div className="flex items-center">
                    {renderSmallStars(3)}
                    <span className="ml-1 text-sm">3.2</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Fairness</span>
                  <div className="flex items-center">
                    {renderSmallStars(4)}
                    <span className="ml-1 text-sm">4.1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Ratings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Ratings
              </h3>
              <div className="space-y-4">
                {recentRatings.map((rating) => (
                  <div
                    key={rating.id}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {rating.subject}
                      </h4>
                      <p className="text-xs text-gray-600">{rating.teacher}</p>
                      <p className="text-xs text-blue-600">
                        {rating.examType} • {rating.date}
                      </p>
                    </div>
                    <div className="flex items-center mb-2">
                      {renderSmallStars(rating.ratings.overall)}
                      <span className="ml-2 text-sm text-gray-600">
                        {rating.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {rating.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
