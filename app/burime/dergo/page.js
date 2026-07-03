"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Link2 } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser } from "../../lib/auth";
import { FACULTIES } from "../../lib/material-options";
import { RESOURCE_CATEGORIES } from "../../lib/resource-options";

const initialForm = {
  url: "",
  title: "",
  description: "",
  category: "",
  faculty: "",
  subject: "",
};

export default function DergoBurimPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (!user) router.push("/llogaria/hyr");
    });
  }, [router]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=submit-resource-link`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, is_anonymous: isAnonymous }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Dërgimi dështoi.");
      setStatus("success");
      setForm(initialForm);
      setIsAnonymous(false);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Dërgimi dështoi.");
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-8 text-center">
          <p className="page-kicker mb-3">Burime shtesë</p>
          <h1 className="page-title mb-3">Dërgo lidhje</h1>
          <p className="page-subtitle">
            Lidhja do të shqyrtohet nga moderatorët para se të shfaqet publikisht.
          </p>
        </header>

        {status === "success" ? (
          <div className="surface-card p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-success-green" />
            <h2 className="mb-3 text-2xl font-bold text-navy-900">
              Lidhja u dërgua për moderim
            </h2>
            <p className="mb-6 text-gray-600">
              Do të njoftoheni kur të aprovohet. Faleminderit për kontributin!
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/burime" className="btn-primary">
                Shiko burimet
              </Link>
              <button type="button" onClick={() => setStatus("idle")} className="btn-outline">
                Dërgo tjetër
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-card space-y-5 p-6 md:p-8">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-900">
                URL <span className="text-burgundy-600">*</span>
              </span>
              <input
                required
                type="url"
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://drive.google.com/..."
                className="input-srh"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-900">
                Titulli <span className="text-burgundy-600">*</span>
              </span>
              <input
                required
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="input-srh"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-900">
                Përshkrimi <span className="text-burgundy-600">*</span>
              </span>
              <textarea
                required
                rows={4}
                minLength={10}
                maxLength={1000}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="input-srh"
                placeholder="Çfarë përmban kjo lidhje dhe pse është e dobishme?"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-900">
                Kategoria <span className="text-burgundy-600">*</span>
              </span>
              <select
                required
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="input-srh"
              >
                <option value="">Zgjidhni</option>
                {RESOURCE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-900">
                Fakulteti <span className="text-burgundy-600">*</span>
              </span>
              <select
                required
                value={form.faculty}
                onChange={(e) => setField("faculty", e.target.value)}
                className="input-srh"
              >
                <option value="">Zgjidhni</option>
                {FACULTIES.map((faculty) => (
                  <option key={faculty.code} value={faculty.code}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-900">
                Lënda / kursi
              </span>
              <input
                value={form.subject}
                onChange={(e) => setField("subject", e.target.value)}
                placeholder="p.sh. Algjebër Lineare"
                className="input-srh"
              />
            </label>

            <div className="rounded-xl border border-gray-200 bg-navy-100/30 p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-navy-900">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 accent-burgundy-600"
                />
                Dërgo si anonim
              </label>
              <p className="mt-1.5 pl-7 text-xs text-gray-500">
                Emri juaj nuk shfaqet publikisht dhe nuk përdoret në kërkim. Moderatorët e shohin për moderim.
              </p>
            </div>

            {error && (
              <p className="rounded-xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn-primary w-full text-base"
            >
              <Link2 className="h-5 w-5" />
              {status === "submitting" ? "Duke dërguar..." : "Dërgo për moderim"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
