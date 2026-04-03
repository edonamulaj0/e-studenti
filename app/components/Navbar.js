"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-md fixed w-full top-0 z-50 border-b border-red-100/60">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-[4.25rem] md:h-20">
          <Link
            href="/"
            className="text-2xl md:text-3xl font-extrabold text-red-600 hover:text-red-700 transition-colors tracking-tight"
            onClick={handleLinkClick}
          >
            E-Studenti
          </Link>

          {/* desktop menu */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className="text-gray-800 hover:text-red-600 transition-colors font-semibold text-[17px] px-3 py-2 rounded-xl hover:bg-red-50"
            >
              Ballina
            </Link>
            <Link
              href="/fakultetet"
              className="text-gray-800 hover:text-red-600 transition-colors font-semibold text-[17px] px-3 py-2 rounded-xl hover:bg-red-50"
            >
              Fakultetet
            </Link>
            <Link
              href="/materialet"
              className="text-gray-800 hover:text-red-600 transition-colors font-semibold text-[17px] px-3 py-2 rounded-xl hover:bg-red-50"
            >
              Materialet
            </Link>
            <Link
              href="/erasmus"
              className="text-gray-800 hover:text-red-600 transition-colors font-semibold text-[17px] px-3 py-2 rounded-xl hover:bg-red-50"
            >
              Erasmus
            </Link>
            <Link
              href="/informacione"
              className="text-gray-800 hover:text-red-600 transition-colors font-semibold text-[17px] px-3 py-2 rounded-xl hover:bg-red-50"
            >
              Informacione
            </Link>
            <Link
              href="/kontakto"
              className="bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all font-bold text-[17px] shadow-lg shadow-red-600/25 hover:scale-105 active:scale-100 ml-1"
            >
              Kontakto
            </Link>
          </div>

          {/* mobile menu hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-800 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl p-2.5 hover:bg-red-50 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white border-t border-red-100 pb-4">
            <div className="px-2 pt-3 space-y-1">
              <Link
                href="/"
                className="block px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-red-50 rounded-xl"
                onClick={handleLinkClick}
              >
                Ballina
              </Link>
              <Link
                href="/fakultetet"
                className="block px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-red-50 rounded-xl"
                onClick={handleLinkClick}
              >
                Fakultetet
              </Link>
              <Link
                href="/materialet"
                className="block px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-red-50 rounded-xl"
                onClick={handleLinkClick}
              >
                Materialet
              </Link>
              <Link
                href="/erasmus"
                className="block px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-red-50 rounded-xl"
                onClick={handleLinkClick}
              >
                Erasmus
              </Link>
              <Link
                href="/informacione"
                className="block px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-red-50 rounded-xl"
                onClick={handleLinkClick}
              >
                Informacione
              </Link>
              <Link
                href="/kontakto"
                className="block mx-2 mt-3 px-4 py-3 text-lg font-bold text-center bg-red-600 text-white rounded-xl hover:bg-red-700"
                onClick={handleLinkClick}
              >
                Kontakto
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
