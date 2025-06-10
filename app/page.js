
  import { BookOpen, Calendar, Users, FileText, Star, ExternalLink } from 'lucide-react'
  import Link from 'next/link'
  
  export default function Home() {
	return (
	  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
		{/* Hero Section */}
		<section className="pt-20 pb-16">
		  <div className="container mx-auto px-4">
			<div className="text-center max-w-4xl mx-auto">
			  <h1 className="text-5xl font-bold text-gray-900 mb-6">
				E-Studenti
			  </h1>
			  <p className="text-xl text-gray-600 mb-8">
				Your unofficial resource hub for University of Prishtina students
			  </p>
			  
			  {/* Disclaimer */}
			  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
				<p className="text-yellow-800 font-medium">
				  ⚠️ Disclaimer: This page is not official of UP (University of Prishtina)
				</p>
			  </div>
  
			  <div className="flex flex-col sm:flex-row gap-4 justify-center">
				<Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
				  Log In with Student Email
				</Link>
				<Link href="/faculties" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors">
				  Browse Faculties
				</Link>
			  </div>
			</div>
		  </div>
		</section>
  
		{/* Quick Access Grid */}
		<section className="py-16">
		  <div className="container mx-auto px-4">
			<h2 className="text-3xl font-bold text-center mb-12">Quick Access</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			  
			  {/* Departments */}
			  <Link href="/departments" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group">
				<div className="flex items-center mb-4">
				  <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
				  <h3 className="text-xl font-semibold">Departments</h3>
				</div>
				<p className="text-gray-600">Browse all departments and their resources</p>
			  </Link>
  
			  {/* Materials */}
			  <Link href="/materials" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group">
				<div className="flex items-center mb-4">
				  <FileText className="w-8 h-8 text-green-600 mr-3" />
				  <h3 className="text-xl font-semibold">Materials</h3>
				</div>
				<p className="text-gray-600">Access study materials and resources</p>
			  </Link>
  
			  {/* Exam Schedule */}
			  <Link href="/exam-schedule" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group">
				<div className="flex items-center mb-4">
				  <Calendar className="w-8 h-8 text-purple-600 mr-3" />
				  <h3 className="text-xl font-semibold">Exam Schedule</h3>
				</div>
				<p className="text-gray-600">View upcoming exam dates and times</p>
			  </Link>
  
			  {/* Rate Exams */}
			  <Link href="/rate-exams" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group">
				<div className="flex items-center mb-4">
				  <Star className="w-8 h-8 text-yellow-600 mr-3" />
				  <h3 className="text-xl font-semibold">Rate Exams</h3>
				</div>
				<p className="text-gray-600">Rate and review past exams</p>
			  </Link>
  
			  {/* Teachers */}
			  <Link href="/teachers" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group">
				<div className="flex items-center mb-4">
				  <Users className="w-8 h-8 text-red-600 mr-3" />
				  <h3 className="text-xl font-semibold">Teachers</h3>
				</div>
				<p className="text-gray-600">Browse teacher profiles and ratings</p>
			  </Link>
  
			  {/* University Pages */}
			  <div className="bg-white rounded-xl shadow-lg p-6">
				<div className="flex items-center mb-4">
				  <ExternalLink className="w-8 h-8 text-indigo-600 mr-3" />
				  <h3 className="text-xl font-semibold">University Pages</h3>
				</div>
				<div className="space-y-2">
				  <a href="https://fiek.uni-pr.edu" target="_blank" rel="noopener noreferrer" 
					 className="block text-red-600 hover:underline">
					FIEK - Faculty of Electrical and Computer Engineering
				  </a>
				  <a href="https://uni-pr.edu" target="_blank" rel="noopener noreferrer" 
					 className="block text-red-600 hover:underline">
					University of Pristina Main Site
				  </a>
				</div>
			  </div>
			</div>
		  </div>
		</section>
  
		{/* Future Features */}
		<section className="py-16 bg-gray-50">
		  <div className="container mx-auto px-4">
			<h2 className="text-3xl font-bold text-center mb-12">Coming Soon</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			  <div className="bg-white rounded-xl shadow-lg p-6 opacity-75">
				<h3 className="text-xl font-semibold mb-2">Friends System</h3>
				<p className="text-gray-600">Connect with fellow students</p>
			  </div>
			  <div className="bg-white rounded-xl shadow-lg p-6 opacity-75">
				<h3 className="text-xl font-semibold mb-2">Teacher Login</h3>
				<p className="text-gray-600">Special features for educators</p>
			  </div>
			  <div className="bg-white rounded-xl shadow-lg p-6 opacity-75">
				<h3 className="text-xl font-semibold mb-2">Live Chat</h3>
				<p className="text-gray-600">Real-time student discussions</p>
			  </div>
			</div>
		  </div>
		</section>
	  </div>
	)
  }