"use client";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function Error404() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Large 404 */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-red-600 mb-4 animate-pulse">
              404
            </h1>
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
          </div>

          {/* Main message */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Faqja nuk u gjet!
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Faqja që po kërkoni nuk ekziston ose po punojmë në të për ta
              përmirësuar.
            </p>

            {/* Status indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <RefreshCw className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700 font-medium">
                Po punojmë në përmirësime...
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Home className="w-5 h-5 mr-2" />
              Kthehu mbrapa
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Po rifresko..." : "Rifresko faqen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
