// app/materialet/materials-client.js
"use client"; // <--- THIS IS ESSENTIAL FOR USESTATE AND OTHER HOOKS

import { useState } from "react";
import { FileText, Download, Eye, Star, Filter, Search } from "lucide-react";

export default function MaterialsClient({ initialMaterials }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const filteredMaterials = initialMaterials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty =
      selectedFaculty === "" || material.faculty === selectedFaculty;
    const matchesType = selectedType === "" || material.type === selectedType;

    return matchesSearch && matchesFaculty && matchesType;
  });

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Materialet</h1>
          <p className="text-xl text-gray-600">
            Gjeni shënime, afate, projekte e të tjera këtu!
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Kërko këtu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Të gjitha Fakultetet</option>
              <option value="FIEK">FIEK</option>
              <option value="MED">Mjekesia</option>
              <option value="ECON">Ekonomiku</option>
              <option value="FIM">FIM</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Të gjitha llojet</option>
              <option value="Ligjerata">Ligjerata</option>
              <option value="Afat">Afat</option>
              <option value="Projekt">Projekt</option>
              <option value="Studim">Studim kërkimor</option>
              <option value="Te tjera">Të tjera</option>
            </select>

            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
              <Filter className="w-4 h-4 mr-2" />
              Vendos filtrat
            </button>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMaterials.map((material) => (
            <div
              key={material.id} // Use material.id as the key, ensure it's unique in your JSON
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {material.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {material.faculty}
                    </span>
                    <span>{material.department}</span>
                  </div>
                </div>
                {/* You might want to dynamically show different icons based on fileType (e.g., PDF, Video) */}
                <FileText className="w-8 h-8 text-red-600" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lënda:</span>
                  <span className="text-sm font-medium">
                    {material.subject}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lloji:</span>
                  <span className="text-sm font-medium">{material.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prof.:</span>
                  <span className="text-sm font-medium">
                    {material.teacher}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                {/* Preview Button: Link directly to the R2 URL */}
                {material.r2Url && (
                  <a
                    href={material.r2Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Shiko
                  </a>
                )}

                {/* Download Button: Link directly to the R2 URL (often same as preview for PDFs/images) */}
                {material.r2Url && (
                  <a
                    href={material.r2Url}
                    target="_blank"
                    download={
                      material.title.replace(/[^a-z0-9]/gi, "_") +
                      "." +
                      (material.fileType || "pdf")
                    } // Added fallback for fileType
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Shkarko
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nuk ka të dhëna.
            </h3>
            <p className="text-gray-500">
              Provoni të ndryshoni kriteret e kërkimit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
