"use client";

import { useState } from "react";
import { ExternalLink, AlertTriangle } from "lucide-react";

export default function ExternalLinkGate({ href, domain, children, className = "" }) {
  const [open, setOpen] = useState(false);
  const targetDomain = domain || safeDomain(href);

  if (!href) return children;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-navy-900/40 p-4 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="external-link-title"
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-cream-50 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning-amber/15 text-warning-amber">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 id="external-link-title" className="text-lg font-semibold text-navy-900">
                  Po dilni nga E-Studenti
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Po hapni një faqe të jashtme:{" "}
                  <span className="font-semibold text-navy-900">{targetDomain}</span>.
                  Ne nuk e kontrollojmë përmbajtjen e faqeve të jashtme — hapeni me kujdes.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="btn-primary flex-1"
                onClick={() => setOpen(false)}
              >
                <ExternalLink className="h-4 w-4" />
                Vazhdo te {targetDomain}
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-outline flex-1"
              >
                Anulo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function safeDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "faqja e jashtme";
  }
}
