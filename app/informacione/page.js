"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Users,
  Code,
  Mail,
  Github,
  MessageSquare,
  ArrowRight,
  Send,
  HelpCircle,
} from "lucide-react";
import { WORKER_URL } from "../lib/worker-url";
import { FAQ_TEASER } from "../lib/faq-content";
import Link from "next/link";

const SUBJECTS = ["Raportoj material", "Kërkesë heqjeje", "Problem teknik", "Bashkëpunim", "Tjetër"];

function SectionCard({ id, icon: Icon, title, children }) {
  return (
    <section
      id={id}
      className="surface-card scroll-mt-28 grid gap-6 p-6 md:grid-cols-[4.5rem_1fr] md:p-8"
    >
      <div className="flex md:items-stretch">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-burgundy-50 text-burgundy-600 md:h-full md:min-h-20 md:w-full">
          <Icon className="h-7 w-7 md:h-9 md:w-9" aria-hidden />
        </span>
      </div>
      <div>
        <h2 className="mb-6 font-display text-2xl font-semibold text-navy-900">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function InformacionePage() {
  const [contributors, setContributors] = useState([]);
  const [loadingContributors, setLoadingContributors] = useState(true);
  const [senderName, setSenderName] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [contactStatus, setContactStatus] = useState("idle");
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadContributors() {
      try {
        const res = await fetch(`${WORKER_URL}/?action=contributors`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Fetch failed");
        if (active) {
          setContributors(Array.isArray(data.contributors) ? data.contributors : []);
        }
      } catch {
        if (active) setContributors([]);
      } finally {
        if (active) setLoadingContributors(false);
      }
    }

    loadContributors();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSubject = params.get("subject");
    if (requestedSubject && SUBJECTS.includes(requestedSubject)) {
      setSubject(requestedSubject);
    }
  }, []);

  const submitContact = async (event) => {
    event.preventDefault();
    setContactStatus("sending");
    setContactError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Dërgimi dështoi.");
      setContactStatus("success");
      setSenderName("");
      setSubject(SUBJECTS[0]);
      setMessage("");
    } catch (err) {
      setContactStatus("error");
      setContactError(err.message || "Dërgimi dështoi.");
    }
  };

  const visibleContributors = [
    ...contributors.filter(
      (c) => `${c.name || ""} ${c.surname || ""}`.trim() !== "Leart Lama"
    ),
    { name: "Leart", surname: "Lama", webNote: "Kontriboi në web" },
  ];

  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-12 max-w-3xl">
          <p className="page-kicker mb-5">Rreth platformës</p>
          <h1 className="page-title mb-5">
            Rreth nesh
          </h1>
          <p className="page-subtitle max-w-3xl text-lg md:text-xl">
            E-Studenti është një iniciativë komunitare e ndërtuar nga studentë —
            jo platformë zyrtare e Universitetit të Prishtinës.
          </p>
          <div className="mt-6 rounded-2xl border border-burgundy-600/20 bg-burgundy-50/60 p-5 text-sm leading-relaxed text-navy-900">
            <strong>Jo zyrtare:</strong> Nuk jemi të autorizuar, të miratuar ose të
            mbështetur nga UP-ja. Materialet janë kontribute vullnetare të
            komunitetit.
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/privatesia" className="text-burgundy-600 hover:underline">
              Privatësia
            </Link>
            <Link href="/kushtet" className="text-burgundy-600 hover:underline">
              Kushtet
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:items-start">
          <aside className="hidden rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur lg:sticky lg:top-28 lg:block">
            {[
              ["#misioni", "Misioni"],
              ["#privatesia", "Privatësia"],
              ["#autoret", "Autorët"],
              ["#kontribuesit", "Kontribuesit"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-burgundy-50 hover:text-burgundy-600"
              >
                {label}
              </a>
            ))}
            <Link
              href="/rreth-nesh/pyetje-te-shpeshta"
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-burgundy-50 hover:text-burgundy-600"
            >
              Pyetje të shpeshta
            </Link>
            {[
              ["#kodi", "Kodi"],
              ["#kontakt", "Kontakti"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-burgundy-50 hover:text-burgundy-600"
              >
                {label}
              </a>
            ))}
          </aside>

          <div className="space-y-8 md:space-y-10">
          <SectionCard id="misioni" icon={Shield} title="Misioni dhe transparenca">
            <div className="space-y-4 text-base leading-relaxed text-gray-600 md:text-lg">
              <p>
                Synojmë t'i ndihmojmë studentët të gjejnë materiale studimore,
                lidhje burimesh dhe informacion fakulteti — me transparencë,
                respekt për autorët dhe pa monetizim.
              </p>
              <p>
                E-Studenti është ndërtuar me synim zero-fitimi — vetëm për të
                ndihmuar studentët. Nuk do të ketë kurrë monetizim: pa reklama,
                pa abonime të paguara dhe pa shitje të dhënave. Ky angazhim
                është i përhershëm.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Jo zyrtare", "Komunitet studentor, jo UP"],
                  ["Transparent", "Kodi publik në GitHub"],
                  ["Privat", "Anonimitet real në kërkim/API publike"],
                  ["Jofitimprurëse", "Pa monetizim — kurrë"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-gray-200 bg-navy-100/50 p-5">
                    <h3 className="font-semibold text-navy-900">{title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard id="autoret" icon={Code} title="Të drejtat e autorit">
            <p className="mb-6 text-base leading-relaxed text-gray-600 md:text-lg">
              Respektojmë të drejtat e autorëve dhe krijuesve të përmbajtjes.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-gray-200 bg-navy-100/50 p-5">
                <h3 className="mb-3 font-semibold text-navy-900">Për autorët</h3>
                <ul className="space-y-2 text-sm text-gray-600 md:text-base">
                  <li>• Kërkesë për heqje — përgjigje sa më shpejt</li>
                  <li>• Heqje pa pyetje të panevojshme</li>
                  <li>• Respekt për kërkesat ligjore</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 font-semibold text-navy-900">Kontakt heqjeje</h3>
                <div className="space-y-3 text-sm md:text-base">
                  <a
                    href="#kontakt"
                    className="flex items-center gap-2 font-semibold text-burgundy-600 hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    Formulari i kontaktit
                  </a>
                  <a
                    href="https://github.com/edonamulaj0/e-studenti"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-semibold text-navy-900 hover:text-burgundy-600"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                  <a
                    href="https://www.instagram.com/estudenti.hub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-semibold text-burgundy-600 hover:underline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    @estudenti.hub
                  </a>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="kontribuesit" icon={Users} title="Kontribuesit">
            <p className="mb-6 text-base italic text-gray-600">
              Faleminderit studentëve dhe profesorëve që kanë ndarë burime.
            </p>
            {loadingContributors && (
              <div className="grid sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-gray-200"
                  />
                ))}
              </div>
            )}
            {!loadingContributors && visibleContributors.length === 0 && (
              <p className="rounded-2xl border border-gray-200 bg-navy-100/50 p-4 text-gray-600">
                Kontribuesit do të shfaqen këtu pasi materiali i parë të ngarkohet.
              </p>
            )}
            {!loadingContributors && visibleContributors.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {visibleContributors.map((c, index) => (
                  <div
                    key={`${c.name}-${c.surname}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-burgundy-50 text-sm font-bold text-burgundy-600">
                      {c.name?.[0]}{c.surname?.[0]}
                    </span>
                    <div>
                      <p className="font-semibold text-navy-900">
                        {c.name} {c.surname}
                      </p>
                      {c.webNote ? (
                        <p className="mt-1 text-sm text-gray-600">{c.webNote}</p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-600">
                          {c.faculty || "Fakulteti"} · {c.material_count} materiale
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard id="faq" icon={HelpCircle} title="Pyetje të shpeshta">
            <p className="mb-6 text-base leading-relaxed text-gray-600 md:text-lg">
              Përgjigje të shpejta për pyetjet më të zakonshme rreth platformës.
            </p>
            <div className="space-y-4">
              {FAQ_TEASER.map((item) => (
                <div
                  key={item.question}
                  className="rounded-2xl border border-gray-200 bg-navy-100/50 p-5"
                >
                  <h3 className="font-semibold text-navy-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/rreth-nesh/pyetje-te-shpeshta"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-burgundy-600 hover:text-burgundy-700"
            >
              Shiko të gjitha pyetjet
              <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionCard>

          <SectionCard id="kodi" icon={Code} title="Kodi i hapur">
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-navy-100/50 p-5">
                <h3 className="mb-2 font-semibold text-navy-900">Transparencë</h3>
                <ul className="space-y-2 text-sm text-gray-600 md:text-base">
                  <li>• Struktura dhe funksionimi të verifikueshëm nga kodi</li>
                  <li>• Pa funksionalitet të fshehur</li>
                </ul>
              </div>
              <a
                href="https://github.com/edonamulaj0/e-studenti"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-2xl bg-navy-900 p-5 text-white transition-all hover:-translate-y-0.5 hover:bg-burgundy-600 hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-lg">GitHub</p>
                  <p className="text-sm text-white/60">Shiko kodin</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </SectionCard>

          <SectionCard id="kufizime" icon={Shield} title="Vërejtje dhe kufizime">
            <div className="grid gap-6 text-sm text-gray-600 md:grid-cols-2 md:text-base">
              <div>
                <h3 className="mb-2 font-semibold text-navy-900">Përgjegjësia</h3>
                <ul className="space-y-2">
                  <li>• Vetëm për qëllime edukative</li>
                  <li>• Verifikoni saktësinë me burimet zyrtare</li>
                  <li>• Përmbajtja mund të jetë e vjetër</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-navy-900">Përdorimi</h3>
                <ul className="space-y-2">
                  <li>• Respektoni ligjet dhe autorët</li>
                  <li>• Përdorni në mënyrë etike</li>
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="kontakt" icon={Mail} title="Kontakti">
            <div>
              <div className="mb-6 rounded-2xl bg-burgundy-50 p-5 text-gray-600">
                <a
                  href="https://www.instagram.com/estudenti.hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 flex items-center gap-2 font-semibold text-burgundy-600 hover:underline"
                >
                  <MessageSquare className="w-5 h-5" />
                  @estudenti.hub
                </a>
                <p className="text-sm leading-relaxed">
                  Formulari më poshtë mund të përdoret për raporte ose njoftime,
                  por për përgjigje direkte ju lutemi shkruani në Instagram.
                </p>
              </div>

              <form onSubmit={submitContact} className="space-y-5">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-navy-900">
                    Emri juaj
                  </span>
                  <input
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="input-srh"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-navy-900">
                    Subjekti
                  </span>
                  <select
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-srh"
                  >
                    {SUBJECTS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-navy-900">
                    Mesazhi
                  </span>
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={7}
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                    className="input-srh min-h-[160px] resize-y py-3"
                  />
                  <span className="mt-1 block text-right text-xs text-gray-400">
                    {message.length}/2000
                  </span>
                </label>

                {contactStatus === "success" && (
                  <p className="rounded-2xl border border-success-green/20 bg-success-green/10 p-4 font-semibold text-success-green">
                    Mesazhi juaj u pranua. Për përgjigje direkte, na shkruani në Instagram: @estudenti.hub.
                  </p>
                )}
                {contactError && (
                  <p className="rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 font-semibold text-burgundy-600">
                    {contactError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={contactStatus === "sending"}
                  className="btn-primary w-full text-base"
                >
                  <Send className="h-5 w-5" />
                  {contactStatus === "sending" ? "Duke dërguar..." : "Dërgo mesazhin"}
                </button>
              </form>
            </div>
          </SectionCard>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-base italic text-gray-600">
          Faleminderit që përdorni E-Studenti — së bashku për një komunitet më të
          hapur.
        </p>
      </div>
    </div>
  );
}
