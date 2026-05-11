"use client";

import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function NotFound() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="pt-16 min-h-screen bg-srh-paper flex items-center justify-center">
      <div
        className="container mx-auto px-4"
        style={{
          paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="font-playfair text-9xl font-bold text-srh-crimson mb-4 animate-pulse">
              404
            </h1>
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-srh-crimson" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-srh-cream shadow-sm p-8 mb-8">
            <h2 className="font-playfair text-3xl font-bold text-srh-navy mb-4">
              Faqja nuk u gjet!
            </h2>
            <p className="text-srh-navy/70 text-lg mb-6">
              Faqja që po kërkoni nuk ekziston ose po punojmë në të për ta
              përmirësuar.
            </p>

            <div className="flex items-center justify-center space-x-2 mb-6 p-4 bg-srh-cream/50 rounded-lg border border-srh-cream">
              <RefreshCw className="w-5 h-5 text-srh-sage" />
              <span className="text-srh-navy font-medium">
                Po punojmë në përmirësime...
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center justify-center px-6 py-3 bg-srh-crimson text-white rounded-lg hover:bg-[#5e1621] transition-colors font-medium"
            >
              <Home className="w-5 h-5 mr-2" />
              Kthehu mbrapa
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center justify-center px-6 py-3 bg-srh-navy text-white rounded-lg hover:bg-srh-crimson transition-colors font-medium disabled:opacity-50"
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
