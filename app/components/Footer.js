"use client";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white py-10 border-t-4 border-red-600">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          <p className="text-base md:text-lg text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} E-Studenti. Të gjitha të drejtat janë të
            rezervuara.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-base text-gray-300">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-400 shrink-0" />
              <span>info@e-studenti.com</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Made by</span>
              <a
                href="https://cyphera.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-white transition-colors"
              >
                Cyphera.
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
