
  'use client'
  import { useState } from 'react'
  import { Mail, Lock, User } from 'lucide-react'
  
  export default function Login() {
	const [isLogin, setIsLogin] = useState(true)
	const [formData, setFormData] = useState({
	  email: '',
	  password: '',
	  confirmPassword: '',
	  studentId: ''
	})
  
	const handleSubmit = (e) => {
	  e.preventDefault()
	  // Handle login/signup logic here
	  console.log('Form submitted:', formData)
	}
  
	const handleChange = (e) => {
	  setFormData({
		...formData,
		[e.target.name]: e.target.value
	  })
	}
  
	return (
	  <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
		<div className="container mx-auto px-4 py-16">
		  <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
			<h1 className="text-3xl font-bold text-center mb-8">
			  {isLogin ? 'Log In' : 'Sign Up'}
			</h1>
  
			<form onSubmit={handleSubmit} className="space-y-6">
			  {!isLogin && (
				<div>
				  <label className="block text-sm font-medium text-gray-700 mb-2">
					Student ID
				  </label>
				  <div className="relative">
					<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input
					  type="text"
					  name="studentId"
					  value={formData.studentId}
					  onChange={handleChange}
					  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
					  placeholder="Enter your student ID"
					  required={!isLogin}
					/>
				  </div>
				</div>
			  )}
  
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
				  Student Email
				</label>
				<div className="relative">
				  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
				  <input
					type="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
					placeholder="your.email@student.uni-pr.edu"
					required
				  />
				</div>
			  </div>
  
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
				  Password
				</label>
				<div className="relative">
				  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
				  <input
					type="password"
					name="password"
					value={formData.password}
					onChange={handleChange}
					className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
					placeholder="Enter your password"
					required
				  />
				</div>
			  </div>
  
			  {!isLogin && (
				<div>
				  <label className="block text-sm font-medium text-gray-700 mb-2">
					Confirm Password
				  </label>
				  <div className="relative">
					<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input
					  type="password"
					  name="confirmPassword"
					  value={formData.confirmPassword}
					  onChange={handleChange}
					  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
					  placeholder="Confirm your password"
					  required={!isLogin}
					/>
				  </div>
				</div>
			  )}
  
			  <button
				type="submit"
				className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold"
			  >
				{isLogin ? 'Log In' : 'Sign Up'}
			  </button>
			</form>
  
			<div className="text-center mt-6">
			  <p className="text-gray-600">
				{isLogin ? "Don't have an account?" : "Already have an account?"}
				<button
				  onClick={() => setIsLogin(!isLogin)}
				  className="text-red-600 hover:underline ml-1"
				>
				  {isLogin ? 'Sign up' : 'Log in'}
				</button>
			  </p>
			</div>
		  </div>
		</div>
	  </div>
	)
  }