"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Award,
  ExternalLink,
} from "lucide-react";

const WEBSITE_BY_SLUG = {
  ffz: "http://filozofiku.uni-pr.edu/",
  fshmn: "http://fshmn.uni-pr.edu/",
  ffl: "http://filologjia.uni-pr.edu/",
  law: "http://juridiku.uni-pr.edu/",
  econ: "http://ekonomiku.uni-pr.edu/",
  fin: "http://fin.uni-pr.edu/",
  fiek: "https://fiek.uni-pr.edu",
  med: "http://mjekesia.uni-pr.edu/",
  art: "http://arte.uni-pr.edu/",
  fbv: "http://fbv.uni-pr.edu/",
  fefs: "http://fefs.uni-pr.edu/",
  edu: "http://edukimi.uni-pr.edu/",
  fa: "http://fa.uni-pr.edu/",
  fim: "http://fim.uni-pr.edu/",
};

function showYear(established) {
  if (!established || typeof established !== "string") return false;
  const t = established.replace(/\s/g, "");
  if (!t) return false;
  if (/^X+$/i.test(t)) return false;
  if (/^tbd$/i.test(t)) return false;
  return true;
}

/**
 * @param {{ faculty: { name: string; code: string; description?: string; established?: string; location?: string; email?: string; phone?: string; departments: { name: string; code: string; description?: string }[] }; materialsQuery: string }}
 */
export default function FacultyDetailLayout({ faculty, materialsQuery }) {
  const {
    name,
    code,
    description,
    established,
    location,
    email,
    phone,
    departments = [],
  } = faculty;

  const website =
    faculty.website || WEBSITE_BY_SLUG[materialsQuery] || null;
  const deptCount = departments.length;

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100 pb-20">
      <div className="container mx-auto px-4 max-w-4xl py-8 md:py-10">
        <Link
          href="/fakultetet"
          className="inline-flex items-center gap-2 text-base font-semibold text-red-600 hover:text-red-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" aria-hidden />
          Kthehu te fakultetet
        </Link>

        <article className="bg-white rounded-2xl shadow-xl border-2 border-red-100 overflow-hidden mb-8">
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-red-50 text-red-700 px-4 py-1.5 text-sm font-bold tracking-wide border border-red-100">
                  {code}
                </span>
                <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {name}
                </h1>
              </div>
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl border-2 border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  Faqja zyrtare
                  <ExternalLink className="w-4 h-4" aria-hidden />
                </a>
              ) : null}
            </div>

            {description ? (
              <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-8 border-t border-gray-100 pt-8">
                {description}
              </p>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 rounded-xl bg-gray-50/90 border border-gray-100 p-4 md:p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <BookOpen className="w-5 h-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Departamente
                  </p>
                  <p className="font-extrabold text-gray-900 text-xl tabular-nums">
                    {deptCount}
                  </p>
                </div>
              </div>
              {showYear(established) ? (
                <div className="flex items-start gap-3 rounded-xl bg-gray-50/90 border border-gray-100 p-4 md:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Award className="w-5 h-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Themeluar
                    </p>
                    <p className="font-extrabold text-gray-900 text-xl">
                      {established}
                    </p>
                  </div>
                </div>
              ) : null}
              {location ? (
                <div className="flex items-start gap-3 rounded-xl bg-gray-50/90 border border-gray-100 p-4 md:p-5 sm:col-span-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <MapPin className="w-5 h-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Vendndodhja
                    </p>
                    <p className="font-semibold text-gray-900 leading-snug">
                      {location}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </article>

        <section className="bg-white rounded-2xl shadow-xl border-2 border-red-100 p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Mail className="w-6 h-6" aria-hidden />
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
              Kontakti
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:border-red-200 hover:bg-red-50/40 transition-colors"
              >
                <Mail
                  className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Email
                  </p>
                  <p className="font-semibold text-red-700 break-all">
                    {email}
                  </p>
                </div>
              </a>
            ) : null}
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:border-red-200 hover:bg-red-50/40 transition-colors"
              >
                <Phone
                  className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Telefon
                  </p>
                  <p className="font-semibold text-gray-900">{phone}</p>
                </div>
              </a>
            ) : null}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-xl border-2 border-red-100 p-6 md:p-8 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <BookOpen className="w-6 h-6" aria-hidden />
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
              Departamentet
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((department, index) => (
              <div
                key={`${department.code}-${index}`}
                className="rounded-2xl border-2 border-gray-100 bg-gray-50/30 p-5 md:p-6"
              >
                <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2">
                  {department.name}
                </h3>
                {department.description ? (
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed line-clamp-4">
                    {department.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/materialet?faculty=${materialsQuery}`}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-8 py-3.5 text-lg font-bold hover:bg-red-700 shadow-lg shadow-red-600/25 transition-colors"
          >
            Materialet për këtë fakultet
          </Link>
          <Link
            href="/fakultetet"
            className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-8 py-3.5 text-lg font-bold text-gray-800 hover:border-red-300 hover:bg-red-50/50 transition-colors"
          >
            Të gjitha fakultetet
          </Link>
        </div>
      </div>
    </div>
  );
}
