"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, LogOut, Plus, PackageCheck } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser, logout } from "../../lib/auth";
import { getFacultyName } from "../../lib/material-options";

function normalizeMaterial(material) {
  return {
    id: material.id,
    userId: material.user_id,
    title: material.title,
    faculty: material.faculty,
    subject: material.subject,
    type: material.type,
    r2Url: material.r2Url || material.r2_url,
    createdAt: material.created_at,
  };
}

function MaterialeEMiaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedCount = Number(searchParams.get("linked") || "0");
  const [user, setUser] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCurrentUser().then((currentUser) => {
      if (!currentUser) {
        router.push("/llogaria/hyr");
        return;
      }
      setUser(currentUser);
      loadMaterials(currentUser);
    });
  }, [router]);

  const loadMaterials = async (currentUser) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=materials&user=me`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/llogaria/hyr");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      const all = (data.materials || []).map(normalizeMaterial);
      const mine = currentUser
        ? all.filter((m) => String(m.userId) === String(currentUser.id))
        : all;
      setMaterials(mine);
    } catch (err) {
      setError(err.message || "Ngarkimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  const doLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl font-black text-srh-navy">
              Mirësevini, {user?.name || "student"}!
            </h1>
            <p className="mt-2 text-srh-navy/70">
              Këtu mund t’i shihni dhe ndryshoni materialet që keni ngarkuar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/llogaria/ngarko"
              className="inline-flex items-center gap-2 rounded-xl bg-srh-crimson px-5 py-3 font-bold text-white hover:bg-[#5e1621]"
            >
              <Plus className="h-5 w-5" />
              Shto material të ri
            </Link>
            <button
              type="button"
              onClick={doLogout}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-srh-navy px-5 py-3 font-bold text-srh-navy hover:bg-srh-navy hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Dil
            </button>
          </div>
        </header>

        {linkedCount > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-success-green/30 bg-success-green/10 p-4">
            <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-success-green" />
            <p className="text-sm font-semibold text-success-green">
              Kemi gjetur {linkedCount} {linkedCount === 1 ? "material" : "materiale"} që keni ndarë më parë —{" "}
              tani {linkedCount === 1 ? "është" : "janë"} në llogarinë tuaj.
            </p>
          </div>
        )}

        {loading && (
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-2xl bg-srh-cream" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-srh-cream bg-white p-6 text-srh-crimson">
            {error}
          </div>
        )}

        {!loading && !error && materials.length === 0 && (
          <div className="rounded-2xl border border-srh-cream bg-white p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-srh-crimson" />
            <h2 className="font-playfair text-2xl font-bold text-srh-navy">
              Ende nuk keni materiale
            </h2>
            <p className="mt-2 text-srh-navy/70">
              Ngarkoni materialin e parë për ta ndarë me komunitetin.
            </p>
          </div>
        )}

        {!loading && materials.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <article
                key={material.id}
                className="rounded-2xl border border-srh-cream bg-white p-6 shadow-sm"
              >
                <FileText className="mb-4 h-9 w-9 text-srh-crimson" />
                <h2 className="text-xl font-bold text-srh-navy">{material.title}</h2>
                <p className="mt-2 text-sm text-srh-navy/60">
                  {getFacultyName(material.faculty)} · {material.subject} · {material.type}
                </p>
                <div className="mt-5 flex gap-3">
                  <Link
                    href={`/llogaria/ndrysho?id=${material.id}`}
                    className="rounded-xl bg-srh-crimson px-4 py-2 font-bold text-white hover:bg-[#5e1621]"
                  >
                    Ndrysho
                  </Link>
                  {material.r2Url && (
                    <a
                      href={material.r2Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border-2 border-srh-navy px-4 py-2 font-bold text-srh-navy hover:bg-srh-navy hover:text-white"
                    >
                      Shiko
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MaterialeEMiaPage />
    </Suspense>
  );
}
