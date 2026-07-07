import StatisticsClient from "./statistics-client";

export const metadata = {
  title: "Statistikat",
  description:
    "Statistika publique agregate të E-Studenti: materiale, shikime, shkarkime, kontribues dhe aktivitet sipas fakultetit.",
  alternates: {
    canonical: "https://e-studenti.com/statistikat",
  },
};

export default function StatisticsPage() {
  return (
    <div className="page-shell">
      <div className="section-shell max-w-6xl">
        <header className="mb-10">
          <p className="page-kicker mb-4">Platforma</p>
          <h1 className="page-title mb-4">Statistikat</h1>
          <p className="page-subtitle max-w-2xl">
            Një pasqyrë e agreguar e aktivitetit në platformë — pa të dhëna
            identifikuese për përdorues individualë.
          </p>
        </header>

        <StatisticsClient />
      </div>
    </div>
  );
}
