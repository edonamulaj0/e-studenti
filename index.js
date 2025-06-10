import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold text-purple-700 mb-4">
        🚨 Disclaimer 🚨
      </h1>
      <p className="max-w-xl mb-10 text-gray-700">
        This is an unofficial student helper site and is not affiliated with UP
        or any of its faculties.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <LinkCard href="/departments" title="Departamentet" />
        <LinkCard href="/materials" title="Materialet" />
        <LinkCard href="/deadlines" title="Afatet" />
        <LinkCard href="/exam-schedules" title="Oraret e provimeve" />
        <LinkCard href="/rate-exam" title="Rate this exam" />
        <LinkCard href="/teachers" title="List of teachers" />
        <a
          href="https://fiek.uni-pr.edu"
          className="bg-white p-4 rounded-xl shadow hover:bg-purple-100 transition"
        >
          Go to FIEK
        </a>
        <LinkCard href="/login" title="Log In (student email)" />
      </div>
    </main>
  );
}

function LinkCard({ href, title }) {
  return (
    <Link
      href={href}
      className="bg-white p-4 rounded-xl shadow hover:bg-purple-100 transition"
    >
      {title}
    </Link>
  );
}
