
  import { Facebook, Instagram, Twitter, Phone, Mail } from 'lucide-react'
  
  export default function Footer() {
	return (
	  <footer className="bg-gray-900 text-white">
		<div className="container mx-auto px-4 py-12">
		  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
			{/* Brand */}
			<div>
			  <h3 className="text-2xl font-bold mb-4">E-Studenti</h3>
			  <p className="text-gray-400 mb-4">
				Your unofficial resource hub for University of Pristina students
			  </p>
			  <p className="text-sm text-gray-500">Made by Edona Mulaj</p>
			</div>
  
			{/* Quick Links */}
			<div>
			  <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
			  <ul className="space-y-2">
				<li><a href="/departments" className="text-gray-400 hover:text-white transition-colors">Departments</a></li>
				<li><a href="/materials" className="text-gray-400 hover:text-white transition-colors">Materials</a></li>
				<li><a href="/teachers" className="text-gray-400 hover:text-white transition-colors">Teachers</a></li>
				<li><a href="/exam-schedule" className="text-gray-400 hover:text-white transition-colors">Exam Schedule</a></li>
			  </ul>
			</div>
  
			{/* Contact */}
			<div>
			  <h4 className="text-lg font-semibold mb-4">Contact</h4>
			  <div className="space-y-2">
				<div className="flex items-center">
				  <Phone className="w-4 h-4 mr-2" />
				  <span className="text-gray-400">+383 XX XXX XXX</span>
				</div>
				<div className="flex items-center">
				  <Mail className="w-4 h-4 mr-2" />
				  <span className="text-gray-400">help@studenthelp.com</span>
				</div>
			  </div>
			  
			  <div className="mt-4">
				<h5 className="font-semibold mb-2">Groups</h5>
				<p className="text-sm text-gray-400">WhatsApp: +383 XX XXX XXX</p>
				<p className="text-sm text-gray-400">Viber: +383 XX XXX XXX</p>
			  </div>
			</div>
  
			{/* Social Media & Contribute */}
			<div>
			  <h4 className="text-lg font-semibold mb-4">Connect & Contribute</h4>
			  <div className="flex space-x-4 mb-4">
				<a href="#" className="text-gray-400 hover:text-white transition-colors">
				  <Facebook className="w-5 h-5" />
				</a>
				<a href="#" className="text-gray-400 hover:text-white transition-colors">
				  <Instagram className="w-5 h-5" />
				</a>
				<a href="#" className="text-gray-400 hover:text-white transition-colors">
				  <Twitter className="w-5 h-5" />
				</a>
			  </div>
			  <a href="/contribute" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-block">
				CONTRIBUTE
			  </a>
			</div>
		  </div>
  
		  <div className="border-t border-gray-800 mt-8 pt-8 text-center">
			<p className="text-gray-400">
			  © 2024 E-Studenti. This is an unofficial student resource website.
			</p>
		  </div>
		</div>
	  </footer>
	)
  }
  