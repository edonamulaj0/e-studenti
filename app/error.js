"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-20 bg-srh-paper">
      <h2 className="font-playfair text-2xl font-bold text-srh-navy mb-4">
        Diçka shkoi keq
      </h2>
      <p className="text-srh-navy/70 mb-6 text-center max-w-md">
        Provo përsëri ose kthehu në ballinë.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-3 bg-srh-crimson text-white rounded-lg font-semibold hover:bg-[#5e1621]"
      >
        Provo përsëri
      </button>
    </div>
  );
}
