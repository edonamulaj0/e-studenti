"use client";

import { useEffect } from "react";
import { useT } from "./components/Preferences";

export default function Error({ error, reset }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-20 bg-srh-paper">
      <h2 className="font-playfair text-2xl font-bold text-srh-navy mb-4">
        {t("Diçka shkoi keq")}
      </h2>
      <p className="text-srh-navy/70 mb-6 text-center max-w-md">
        {t("Provo përsëri ose kthehu në ballinë.")}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-3 bg-srh-crimson text-white rounded-lg font-semibold hover:bg-burgundy-700"
      >
        {t("Provo përsëri")}
      </button>
    </div>
  );
}
