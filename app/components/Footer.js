"use client";
import { Facebook, Instagram, Twitter, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">E-Studenti</h3>
            <p className="text-gray-400 mb-4">
              Qendra e burimeve jo-zyrtare për studentët e Universitetit të
              Prishtinës.
            </p>
            <p className="text-sm text-gray-500">Punuar në baza vullnetare.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              Ndërlidhjet e shpejta
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/fakultetet"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Fakultetet
                </a>
              </li>
              <li>
                <a
                  href="/materialet"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Materialet
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontakti</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-gray-400">info@e-studenti.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 E-Studenti. Të gjitha të drejtat janë të rezervuara.
          </p>
        </div>
      </div>
    </footer>
  );
}
