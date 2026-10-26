const MONTHS = ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"];

/** "2027-09-30" -> "30 shtator 2027" (the browser's sq locale is not always installed). */
export function formatDate(iso, t = (s) => s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${Number(m[3])} ${t(MONTHS[Number(m[2]) - 1])} ${m[1]}` : iso || "—";
}
