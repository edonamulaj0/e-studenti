"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { fetchCurrentUser } from "../lib/auth";
import { WORKER_URL } from "../lib/worker-url";
import { useT } from "./Preferences";

/** The signed-in user's followed subject slugs, fetched once per page load. */
let followsPromise = null;
function loadFollows() {
  if (!followsPromise) {
    followsPromise = fetch(`${WORKER_URL}/?action=my-follows`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { follows: [] }))
      .then((data) => new Set((data.follows || []).map((follow) => follow.slug)))
      .catch(() => new Set());
  }
  return followsPromise;
}

/**
 * Follow a subject to get a weekly email of its new materials. Signed-out
 * visitors are sent to sign in first.
 */
export default function FollowSubjectButton({ slug }) {
  const t = useT();
  const [user, setUser] = useState(undefined);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then(async (current) => {
      if (cancelled) return;
      setUser(current);
      if (current) {
        const follows = await loadFollows();
        if (!cancelled) setFollowing(follows.has(slug));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (user === undefined) return null;
  if (!user) {
    return (
      <Link
        href="/llogaria/hyr"
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-navy-900 hover:bg-gray-100"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {t("Hyni për ta ndjekur lëndën")}
      </Link>
    );
  }

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=follow-subject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, follow: !following }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
      setFollowing(data.following);
      const follows = await loadFollows();
      if (data.following) follows.add(slug);
      else follows.delete(slug);
    } catch (err) {
      setError(err.message || "Veprimi dështoi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={following}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60 ${
          following
            ? "border border-burgundy-600 bg-burgundy-50 text-burgundy-600"
            : "bg-ink text-white"
        }`}
      >
        {following ? <BellOff className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
        {following ? t("Po e ndiqni") : t("Ndiq lëndën")}
      </button>
      <span className="text-sm text-gray-600">
        {following ? t("Do të merrni një email në javë kur ka materiale të reja.") : t("Email një herë në javë me materialet e reja.")}
      </span>
      {error && (
        <span role="alert" className="text-sm font-semibold text-burgundy-600">
          {t(error)}
        </span>
      )}
    </div>
  );
}
