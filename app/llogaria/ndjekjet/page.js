"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { fetchCurrentUser } from "../../lib/auth";
import { getFacultyName } from "../../lib/material-options";
import { WORKER_URL } from "../../lib/worker-url";
import { useT } from "../../components/Preferences";

/**
 * Subjects you follow for the weekly email. The email's "unsubscribe" link
 * lands here with a signed `u`/`s` pair, which works without signing in.
 */
export default function NdjekjetPage() {
  const t = useT();
  const [state, setState] = useState("loading"); // loading | unsubscribed | invalid | signed-out | list
  const [follows, setFollows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    const s = params.get("s");
    if (u && s) {
      fetch(`${WORKER_URL}/?action=unsubscribe-digest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u, s }),
      })
        .then((res) => setState(res.ok ? "unsubscribed" : "invalid"))
        .catch(() => setState("invalid"));
      return;
    }
    fetchCurrentUser().then(async (user) => {
      if (!user) {
        setState("signed-out");
        return;
      }
      try {
        const res = await fetch(`${WORKER_URL}/?action=my-follows`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Lista nuk u ngarkua.");
        setFollows(data.follows || []);
      } catch (err) {
        setError(err.message || "Lista nuk u ngarkua.");
      }
      setState("list");
    });
  }, []);

  const unfollow = async (slug) => {
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=follow-subject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, follow: false }),
      });
      if (!res.ok) throw new Error("Veprimi dështoi.");
      setFollows((current) => current.filter((follow) => follow.slug !== slug));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-srh-paper px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="font-playfair text-4xl font-black text-srh-navy">{t("Lëndët që ndiqni")}</h1>
          <p className="mt-3 text-srh-navy/70">
            {t("Një herë në javë, të hënën, ju dërgojmë një email me materialet e reja në këto lëndë.")}
          </p>
        </header>

        {state === "loading" && <div className="h-32 animate-pulse rounded-2xl bg-srh-cream" role="status" aria-busy="true" />}

        {state === "unsubscribed" && (
          <div role="status" className="rounded-2xl border border-success-green/30 bg-success-green/10 p-6 text-success-text">
            <CheckCircle2 className="mb-2 h-6 w-6" aria-hidden />
            <p className="font-semibold">{t("U çregjistruat. Nuk do të merrni më email për lëndët që ndiqnit.")}</p>
          </div>
        )}

        {state === "invalid" && (
          <p role="alert" className="rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-6 font-semibold text-burgundy-600">
            {t("Lidhja e çregjistrimit nuk është e vlefshme. Hyni në llogari për të menaxhuar lëndët që ndiqni.")}
          </p>
        )}

        {state === "signed-out" && (
          <p className="rounded-2xl border border-srh-cream bg-surface p-6 text-srh-navy/80">
            <Link href="/llogaria/hyr" className="font-bold text-srh-crimson hover:underline">
              {t("Hyni")}
            </Link>{" "}
            {t("për të parë lëndët që ndiqni.")}
          </p>
        )}

        {state === "list" && (
          <>
            {error && (
              <p role="alert" className="mb-4 text-sm font-semibold text-burgundy-600">
                {t(error)}
              </p>
            )}
            {follows.length === 0 ? (
              <div className="rounded-2xl border border-srh-cream bg-surface p-8 text-center text-srh-navy/80">
                <Bell className="mx-auto mb-3 h-8 w-8 text-srh-crimson" aria-hidden />
                {t("Nuk ndiqni asnjë lëndë. Hapni faqen e një lënde dhe shtypni “Ndiq lëndën”.")}
                <div className="mt-4">
                  <Link href="/materialet" className="font-bold text-srh-crimson hover:underline">
                    {t("Shfleto materialet")}
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="grid gap-2">
                {follows.map((follow) => (
                  <li
                    key={follow.slug}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-srh-cream bg-surface p-4"
                  >
                    <div className="min-w-0">
                      <Link href={`/lenda/${follow.slug}`} className="font-bold text-srh-navy hover:underline">
                        {follow.name || follow.slug}
                      </Link>
                      {follow.faculty && <p className="text-sm text-srh-navy/70">{t(getFacultyName(follow.faculty))}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => unfollow(follow.slug)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-srh-cream px-3 py-2 text-sm font-semibold text-srh-navy hover:bg-srh-cream"
                    >
                      <BellOff className="h-4 w-4" aria-hidden />
                      {t("Mos e ndiq")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
