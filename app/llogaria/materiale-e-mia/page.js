"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, LogOut, Plus, PackageCheck, ShieldAlert, Eye, Download } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser, logout, setUser as setSessionUser } from "../../lib/auth";
import ModalOverlay from "../../components/ModalOverlay";
import { getFacultyName } from "../../lib/material-options";
import { formatStatCount } from "../../lib/track-material";

function normalizeMaterial(material) {
  return {
    id: material.id,
    userId: material.user_id,
    title: material.title,
    faculty: material.faculty,
    subject: material.subject,
    type: material.type,
    r2Url: material.r2Url || material.r2_url,
    view_count: Number(material.view_count || 0),
    download_count: Number(material.download_count || 0),
    createdAt: material.created_at,
    status: material.status || "approved",
    rejectionReason: material.rejection_reason || "",
  };
}

const STATUS_BADGES = {
  pending: {
    label: "Në pritje të shqyrtimit",
    className: "bg-warning-amber/15 text-warning-amber",
  },
  rejected: {
    label: "Nuk u aprovua",
    className: "bg-burgundy-50 text-burgundy-600",
  },
};

function MaterialeEMiaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedCount = Number(searchParams.get("linked") || "0");
  const [user, setUser] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
      // The API returns at most 100 per page; follow it so nothing is hidden.
      const all = [];
      for (let page = 1; page <= 50; page += 1) {
        const res = await fetch(
          `${WORKER_URL}/?action=materials&user=me&limit=100&page=${page}`,
          { credentials: "include" }
        );
        if (res.status === 401) {
          router.push("/llogaria/hyr");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
        all.push(...(data.materials || []).map(normalizeMaterial));
        if (!data.pagination?.hasNextPage) break;
      }
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

  const exportData = async () => {
    setExporting(true);
    setAccountMessage("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=export-account`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Shkarkimi dështoi.");
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "e-studenti-te-dhenat.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setAccountMessage(err.message || "Shkarkimi dështoi.");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=delete-account`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm_email: confirmEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Fshirja dështoi.");
      setSessionUser(null);
      router.push("/");
    } catch (err) {
      setDeleteError(err.message || "Fshirja dështoi.");
    } finally {
      setDeleting(false);
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
            {user?.is_moderator && (
              <Link
                href="/llogaria/moderim"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-warning-amber/60 px-5 py-3 font-bold text-warning-amber hover:bg-warning-amber/10"
              >
                <ShieldAlert className="h-5 w-5" />
                Moderim
              </Link>
            )}
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
                {STATUS_BADGES[material.status] && (
                  <p
                    className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      STATUS_BADGES[material.status].className
                    }`}
                  >
                    {STATUS_BADGES[material.status].label}
                  </p>
                )}
                <h2 className="text-xl font-bold text-srh-navy">{material.title}</h2>
                {material.status === "rejected" && (
                  <p className="mt-2 text-sm text-srh-navy/75">
                    <span className="font-semibold">Arsyeja:</span>{" "}
                    {material.rejectionReason || "—"}. Ndryshojeni materialin për ta
                    ridërguar për shqyrtim.
                  </p>
                )}
                <p className="mt-2 text-sm text-srh-navy/60">
                  {getFacultyName(material.faculty)} · {material.subject} · {material.type}
                </p>
                {(material.view_count > 0 || material.download_count > 0) && (
                  <p className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-srh-navy/55">
                    {material.view_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {formatStatCount(material.view_count)} shikime
                      </span>
                    )}
                    {material.download_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        {formatStatCount(material.download_count)} shkarkime
                      </span>
                    )}
                  </p>
                )}
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

        {!loading && user && (
          <section
            aria-labelledby="account-heading"
            className="mt-12 rounded-2xl border border-srh-cream bg-white p-6"
          >
            <h2 id="account-heading" className="text-xl font-bold text-srh-navy">
              Të dhënat e llogarisë
            </h2>
            <p className="mt-2 text-sm text-srh-navy/70">
              Mund të shkarkoni një kopje të të dhënave që mbajmë për ju: profili, materialet dhe
              lidhjet që keni dërguar, dhe raportet që keni bërë.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={exportData}
                disabled={exporting}
                className="btn-outline"
              >
                {exporting ? "Duke përgatitur…" : "Shkarko të dhënat e mia"}
              </button>
              {!user.is_moderator && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmEmail("");
                    setDeleteError("");
                    setDeleteOpen(true);
                  }}
                  className="btn-outline text-burgundy-600"
                >
                  Fshi llogarinë
                </button>
              )}
            </div>
            {accountMessage && (
              <p role="alert" className="mt-3 text-sm font-semibold text-burgundy-600">
                {accountMessage}
              </p>
            )}
          </section>
        )}
      </div>

      <ModalOverlay open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={(e) => e.stopPropagation()}
          onSubmit={deleteAccount}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        >
          <h2 id="delete-account-title" className="text-lg font-bold text-srh-navy">
            Fshi llogarinë
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-srh-navy/75">
            <li>Emri, mbiemri dhe emaili juaj fshihen dhe nuk mund të hyni më.</li>
            <li>
              Materialet e publikuara <strong>mbeten</strong> si &quot;Anonim&quot; dhe nuk mund t&apos;i
              ndryshoni ose fshini më (vetëm një moderator mund t&apos;i heqë).
            </li>
            <li>Materialet në pritje ose të refuzuara fshihen përgjithmonë.</li>
            <li>Ky veprim nuk kthehet mbrapsht.</li>
          </ul>
          <label htmlFor="confirm-email" className="mt-4 block text-sm font-semibold text-srh-navy">
            Shkruani emailin tuaj ({user?.email}) për ta konfirmuar
          </label>
          <input
            id="confirm-email"
            type="email"
            required
            autoComplete="off"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className="input-srh mt-1.5"
          />
          {deleteError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-burgundy-600">
              {deleteError}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={deleting || confirmEmail.trim().toLowerCase() !== (user?.email || "").toLowerCase()}
              className="btn-primary flex-1"
            >
              {deleting ? "Duke fshirë…" : "Fshi llogarinë"}
            </button>
            <button
              type="button"
              data-autofocus
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
              className="btn-outline flex-1"
            >
              Anulo
            </button>
          </div>
        </form>
      </ModalOverlay>
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
