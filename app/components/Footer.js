"use client";
import { Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
            <div className="flex space-x-6 text-sm">
              <p className="text-gray-500">
                © 2025 E-Studenti. Të gjitha të drejtat janë të rezervuara.
              </p>
            </div>
          </div>

          {/* Contact and Copyright */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
            <div className="flex items-center text-gray-400">
              <Mail className="w-4 h-4 mr-2" />
              <span>info@e-studenti.com</span>
              <Phone className="w-4 h-4 mr-2 ml-5" />
              <span>+383 48 855 355</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
