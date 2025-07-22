"use client";
import { Mail, X, Minimize2, Square } from "lucide-react";

export default function Kontakto() {
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12">
            Na kontaktoni
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side - Dërgo materiale */}
            <div className="p-8 bg-red-50 rounded-lg border-l-4 border-red-600 h-fit">
              <div className="flex items-center mb-4">
                <Mail className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold">Dërgo materiale!</h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                A keni materiale, afate apo burime të tjera për të ndarë me
                studentët? Na dërgoni email me të dhënat e nevojshme.
              </p>

              <div className="bg-white p-4 rounded border-l-2 border-blue-500">
                <h4 className="font-medium mb-2 text-blue-700">
                  Informacionet e nevojshme:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Fakulteti</li>
                  <li>• Departamenti</li>
                  <li>• Lënda</li>
                  <li>• Semestri</li>
                  <li>• Mësuesi</li>
                </ul>
              </div>
            </div>

            {/* Right side - Gmail-style compose window */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              {/* Gmail header */}
              <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b">
                <h3 className="text-sm font-medium text-gray-700">
                  New Message
                </h3>
                <div className="flex space-x-2">
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Minimize2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Square className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Gmail compose form */}
              <div className="p-4 space-y-3">
                <div className="flex items-center">
                  <label className="text-sm text-gray-600 w-16">To:</label>
                  <input
                    type="email"
                    value="info@e-studenti.com"
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="text-sm text-gray-600 w-16">Subject:</label>
                  <input
                    type="text"
                    value="Fakulteti - Departamenti"
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4">
                  <textarea
                    value="Lënda - Semestri - Mësuesi"
                    readOnly
                    rows={8}
                    className="w-full px-3 py-2 bg-gray-50 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium">
                    Send
                  </button>
                  <div className="flex space-x-2 text-gray-500">
                    <button className="text-sm hover:text-gray-700">
                      Attach files
                    </button>
                    <button className="text-sm hover:text-gray-700">
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
