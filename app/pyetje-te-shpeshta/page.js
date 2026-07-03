"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FaqLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/rreth-nesh/pyetje-te-shpeshta");
  }, [router]);

  return (
    <div className="page-shell">
      <div className="section-shell max-w-3xl text-center text-gray-600">
        Duke ju ridrejtuar…
      </div>
    </div>
  );
}
