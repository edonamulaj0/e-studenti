"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-20">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Diçka shkoi keq
      </h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Provo përsëri ose kthehu në ballinë.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
      >
        Provo përsëri
      </button>
    </div>
  );
}
