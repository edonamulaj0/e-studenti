
  'use client'
  import { useState } from 'react'
  import Link from 'next/link'
  import { Menu, X, User } from 'lucide-react'
  
  export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false)
  
	return (
	  <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
		<div className="container mx-auto px-4">
		  <div className="flex justify-between items-center h-16">
			{/* Logo */}
			<Link href="/" className="text-2xl font-bold text-blue-600">
			  StudentHelp
			</Link>
  
			{/* Desktop Menu */}
			<div className="hidden md:flex items-center space-x-8">
			  <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
				Home
			  </Link>
			  <div className="relative group">
				<button className="text-gray-700 hover:text-blue-600 transition-colors">
				  Faculty
				</button>
				<div className="absolute top-full left-0 bg-white shadow-lg rounded-lg py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
				  <Link href="/departments" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
					Departments
				  </Link>
				  <Link href="/materials" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
					Materials
				  </Link>
				  <Link href="/exam-schedule" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
					Exam Schedule
				  </Link>
				</div>
			  </div>
			  <Link href="/erasmus" className="text-gray-700 hover:text-blue-600 transition-colors">
				Erasmus
			  </Link>
			  <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
				Contact
			  </Link>
			  <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
				<User className="w-4 h-4 mr-2" />
				Log In
			  </Link>
			</div>
  
			{/* Mobile Menu Button */}
			<button 
			  onClick={() => setIsOpen(!isOpen)}
			  className="md:hidden text-gray-700"
			>
			  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
			</button>
		  </div>
  
		  {/* Mobile Menu */}
		  {isOpen && (
			<div className="md:hidden bg-white border-t">
			  <div className="px-2 pt-2 pb-3 space-y-1">
				<Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
				  Home
				</Link>
				<Link href="/departments" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
				  Departments
				</Link>
				<Link href="/materials" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
				  Materials
				</Link>
				<Link href="/exam-schedule" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
				  Exam Schedule
				</Link>
				<Link href="/erasmus" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
				  Erasmus
				</Link>
				<Link href="/contact" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
				  Contact
				</Link>
				<Link href="/login" className="block px-3 py-2 bg-blue-600 text-white rounded">
				  Log In
				</Link>
			  </div>
			</div>
		  )}
		</div>
	  </nav>
	)
  }
  