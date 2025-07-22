import { BookOpen, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-20 pb-16 mt-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              E-Studenti
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Qendra e burimeve jo-zyrtare për studentët e Universitetit të
              Prishtinës
            </p>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-yellow-800 font-medium">
                ⚠️ Vërejtje: Kjo faqe është ndërtuar nga studentët për
                studentët, dhe nuk ka lidhje zyrtare me Universitetin e
                Prishtinës.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/fakultetet"
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Shikoni materialet
              </Link>
              <Link
                href="/materialet"
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold border-2 border-red-600 hover:bg-red-50 transition-colors"
              >
                Eksploroni fakultetet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Qasje e shpejtë
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Faculties */}
            <Link
              href="/fakultetet"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <BookOpen className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold">Fakultetet</h3>
              </div>
              <p className="text-gray-600">
                Eksploroni të gjitha fakultetet e Universitetit të Prishtinës.
              </p>
            </Link>

            {/* Materials */}
            <Link
              href="/materialet"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <FileText className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold">Materialet</h3>
              </div>
              <p className="text-gray-600">
                Shikoni materialet dhe burimet e tjera.
              </p>
            </Link>
            {/* University Pages */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <ExternalLink className="w-8 h-8 text-indigo-600 mr-3" />
                <h3 className="text-xl font-semibold">Faqet e Universitetit</h3>
              </div>
              <div className="space-y-2">
                <a
                  href="https://uni-pr.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-red-600 hover:underline"
                >
                  Faqja kryesore e Universitetit të Prishtinës
                </a>
                <a
                  href="https://fiek.uni-pr.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-red-600 hover:underline"
                >
                  FIEK - Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future Features */}
      {/* <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Së shpejti!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 opacity-75">
              <h3 className="text-xl font-semibold mb-2">Sistemi i përdoruesit</h3>
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
      </section> */}
    </div>
  );
}
