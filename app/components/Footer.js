"use client";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand and Links */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
            <h3 className="text-lg font-bold">E-Studenti</h3>
            <div className="flex space-x-6 text-sm">
              <a
                href="/fakultetet"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Fakultetet
              </a>
              <a
                href="/materialet"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Materialet
              </a>
            </div>
          </div>

          {/* Contact and Copyright */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
            <div className="flex items-center text-gray-400">
              <Mail className="w-4 h-4 mr-2" />
              <span>info@e-studenti.com</span>
            </div>
            <p className="text-gray-500">© 2025 E-Studenti</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
