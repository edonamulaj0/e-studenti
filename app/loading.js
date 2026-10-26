/**
 * Shown while a route is loading during client-side navigation. A quiet
 * skeleton rather than a spinner: no motion for people who ask for none, and the
 * layout does not jump when the page arrives.
 */
import { T } from "./components/Preferences";

export default function Loading() {
  const bar = "rounded-lg bg-gray-200 motion-safe:animate-pulse";
  return (
    <div className="page-shell" role="status" aria-busy="true">
      <span className="sr-only"><T>Duke ngarkuar…</T></span>
      <div className="section-shell" aria-hidden="true">
        <div className={`${bar} mb-4 h-8 w-32 rounded-full!`} />
        <div className={`${bar} mb-4 h-12 w-2/3`} />
        <div className={`${bar} mb-10 h-5 w-full max-w-xl`} />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${bar} h-56 rounded-3xl!`} />
          ))}
        </div>
      </div>
    </div>
  );
}
