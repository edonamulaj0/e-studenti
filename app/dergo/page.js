"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DergoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/llogaria/ngarko");
  }, [router]);

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-20 text-center">
      <h1 className="font-playfair text-4xl font-bold text-srh-navy">
        Duke ju dërguar te formulari i ngarkimit...
      </h1>
    </div>
  );
}
