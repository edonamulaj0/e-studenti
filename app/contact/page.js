"use client";
import { useState } from "react";
import { Phone, Mail, MessageSquare, Send } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    materialFile: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Contact form submitted:", formData);
    alert("Thank you for your message! We will get back to you soon.");
  };

  const handleChange = (e) => {
    if (e.target.type === "file") {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0],
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12">Contact Us</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>

              <div className="space-y-6">
                <div className="flex items-center">
                  <Phone className="w-6 h-6 text-red-600 mr-4" />
                  <div>
                    <h3 className="font-semibold">Phone Numbers</h3>
                    <p className="text-gray-600">+383 XX XXX XXX</p>
                    <p className="text-gray-600">+383 XX XXX XXX</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-red-600 mr-4" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-600">help@studenthelp.com</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MessageSquare className="w-6 h-6 text-red-600 mr-4" />
                  <div>
                    <h3 className="font-semibold">Social Groups</h3>
                    <p className="text-gray-600">WhatsApp: +383 XX XXX XXX</p>
                    <p className="text-gray-600">Viber: +383 XX XXX XXX</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Send Materials!</h3>
                <p className="text-gray-600">
                  Have study materials, past exams, or resources to share? Use
                  the form to submit them and help other students!
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="submit-materials">Submit Materials</option>
                    <option value="report-issue">Report Issue</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Materials (Optional)
                  </label>
                  <input
                    type="file"
                    name="materialFile"
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX, PPT, PPTX, TXT
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
