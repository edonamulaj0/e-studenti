"use client";

import { Home, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import MaterialDetail from "./components/MaterialDetail";
import { useLateMaterial } from "./lib/use-late-material";

/**
 * Stands in for the page while we find out whether this address is a material
 * added since the last build. It is also what the static 404.html contains, so
 * the "not found" text is never painted first and then replaced.
 */
function PageSkeleton() {
  const bar = "rounded-lg bg-gray-200 motion-safe:animate-pulse";
  return (
    <div className="page-shell" role="status" aria-busy="true">
      <span className="sr-only">Duke ngarkuar…</span>
      <noscript>
        <p className="mb-6 text-center text-lg font-semibold text-navy-900">
          Faqja nuk u gjet. Aktivizoni JavaScript për të parë materialet e shtuara së fundi.
        </p>
      </noscript>
      <div className="section-shell max-w-4xl" aria-hidden="true">
        <div className={`${bar} mb-6 h-4 w-56`} />
        <div className="surface-card p-6 md:p-10">
          <div className="mb-6 flex gap-2">
            <div className={`${bar} h-7 w-32 !rounded-full`} />
            <div className={`${bar} h-7 w-24 !rounded-full`} />
            <div className={`${bar} h-7 w-20 !rounded-full`} />
          </div>
          <div className={`${bar} mb-4 h-10 w-3/4`} />
          <div className={`${bar} mb-8 h-5 w-1/2`} />
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${bar} h-20 !rounded-2xl`} />
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className={`${bar} h-12 flex-1 !rounded-xl`} />
            <div className={`${bar} h-12 flex-1 !rounded-xl`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  const [isLoading, setIsLoading] = useState(false);
  const late = useLateMaterial();

  if (late.phase === "found") {
    return <MaterialDetail material={late.material} slug={late.slug} />;
  }
  if (late.phase === "checking" || late.phase === "loading") {
    return <PageSkeleton />;
  }

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="pt-16 min-h-[70vh] bg-srh-paper flex items-center justify-center">
      <div
        className="container mx-auto px-4"
        style={{
          paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="font-playfair text-9xl font-bold text-srh-crimson mb-4">
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
              className="flex items-center justify-center px-6 py-3 bg-srh-crimson text-white rounded-lg hover:bg-burgundy-700 transition-colors font-medium"
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
