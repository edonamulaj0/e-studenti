# Phase 0: feasibility of the Kosovo university directory

Status: in progress. Everything here comes from sources read on 2026-10-11.

## 1. Registry (done)

`aka-programmes-2026.csv` is the Kosovo Accreditation Agency's "Tabela e programeve të akredituara 2026" (17-page PDF supplied by the project owner), parsed into one row per programme and campus.

| | |
|---|---|
| Rows | 426 (241 public, 185 private or other) |
| Institutions | 21 (UP counts once, with its 14 faculties as units) |
| Levels | BSc 125, MSc 90, BA 68, MA 57, professional bachelor 34, LLM 19, PhD 10, LLB 10, other 13 |
| Campuses | Prishtinë 310, Prizren 26, Mitrovicë 23, Pejë 22, Ferizaj 20, Gjilan 13, Gjakovë 11, Vushtrri 1 |
| Accreditation valid until | 2027: 151 · 2028: 98 · 2029: 109 · 2030: 39 · 2031: 28 |

Checks: every programme number runs 1..n inside its block; each of the 38 blocks has exactly one institution label (found by position, because the PDF merges the label cell vertically); the UP blocks give 14 faculties.

Caveats:
- This is the only authority for "is this programme valid", but the list has no fees, courses or syllabi.
- 151 programmes (about a third) are accredited only until 2027-09-30, so status must be stored with a date and re-read yearly.
- Some well-known institutions are not on this list at all. That is a finding about accreditation, not an error, but whether to show them is decision 1 of the plan.
- Programme names are free text ("Shkencë Politike: a) ... b) ..."). Normalisation is a later step.

## 2. What the institutions publish (pilot, partial)

| Institution | Programme list | Curriculum | Syllabi | Fees |
|---|---|---|---|---|
| Universum (UNI) | HTML catalogue with filters | Full semester-by-semester course list with ECTS in HTML | not seen | not on the pages read |
| UBT | HTML list per level, one page per programme | Narrative "program structure" page; course list not seen in the pages read | not seen | not on the pages read |
| AAB | Faculty pages | not found in a quick look | not seen | not found (the "Çmimet" page is about awards) |
| UP and its faculties (`uni-pr.edu`, `*.uni-pr.edu`) | **not reachable** | | | |

UP's sites answer our requests with a Cloudflare "Just a moment" challenge (HTTP 403), even from a real browser. I did not try to get around it. Options: ask UP's IT office for permission or a data export, or collect UP pages by hand.

Early reading: curriculum data is easiest where an institution publishes plain HTML (Universum). Fees and syllabi were not found on the pages sampled, so those need a dedicated search per institution and, probably, direct requests.

## 3. Fees (pilot)

- **Public universities:** Prizren's page says student tariffs are set by the Ministry of Education (MEST) and reviewed yearly (administrative instruction), e.g. 25 EUR per semester for regular bachelor students, 150 EUR per semester for scientific master studies, first year free. If that holds for all public universities, public fees are one national table, not 7 separate data sets. To confirm against the MEST instruction itself.
- **AAB:** publishes a 43-page PDF, one block per programme (`aab-edu.net/wp-content/uploads/2025/12/Tuition-fees-AAB-College.pdf`), parsed cleanly into 43 programme/fee pairs (e.g. Public Administration BA 825, Computer Science and Software Engineering BSc 1,250, Nursing BSc 1,900, Dentistry 875). Problems: the PDF says fees are "per semester" in the intro but never states the unit per programme, so it must be confirmed with AAB; only 21 of 49 AKA programme names match exactly (typos such as "Busienss", "Journalsim", renamed programmes, and AKA programmes with no fee block, e.g. Logopedics), so matching needs fuzzy match plus a human check.
- **UBT, Universum:** no fee figures found on the pages read or through search (UBT's rules say tuition is set by its board without stating amounts). Likely needs the admissions office.
- **UP:** not reachable (see above).

## 4. Findings so far

1. The registry is solved and authoritative (426 rows).
2. Curriculum quality differs a lot by institution; Universum is machine-readable, UBT and AAB need deeper digging.
3. Fees exist as documents at some institutions (AAB) and as a national tariff for public ones, but not everywhere, and units are ambiguous. Every price will need source, date and unit, and some will stay "not published".
4. Matching AKA names to institution pages is a real task: free-text names, typos, renames.
5. UP (the largest public university, 146 of 426 programmes) is blocked by a bot challenge and needs a permission or manual route.

## 5. Still to do

- UBT and Universum fees by contacting admissions; check the MEST instruction for the public tariff.
- Source inventory for the remaining institutions.
- An end-to-end extraction of 2-3 programmes with source checks, then the cost estimate and recommendation.

## 6. First public pages

`scripts/build-directory-data.mjs` turns the CSV into `app/data/universities.json`. The site shows it at `/universitetet` (cards), `/universitetet/<slug>` (programmes by level, Bachelor to PhD) and `/krahaso` (two programmes side by side). The old `/fakultetet` pages still exist but are no longer linked from the navigation.

## 7. Where study plans and syllabi actually live (survey, 2026-10-11)

The owner pointed to a UBT PDF (`2023-2028-BSc-Prishtine-ENG.pdf`: the 3-page study plan of BSc Management, Business and Economics, Prishtina, with every course, semester, hours, ECTS and course code). I looked for the same kind of document at every institution that was reachable. Result: **no institution publishes one such PDF per programme.** What exists is a mix.

| Institution | What I found |
|---|---|
| UBT | 60 English programme pages. Course plans are **HTML tables** on each programme's "Curriculum structure" page (checked: Law, Computer Science), plus PDFs for only some: MBE (one PDF per campus: Prishtina, Ferizaj, Prizren, in Albanian and English), Fintech BSc/MSc ("study plan and syllabus"), Mechatronics (syllabi), and per-course syllabus PDFs for Political Science (56), Security Studies (50), Sport Science (49), Public Policy (28), Health and Physical Activity (35), Civil Engineering MSc (19). About 20 of 60 programmes have any PDF; many of those are timetables, not plans. |
| AAB | 50 programme pages under `/fakultetet/<faculty>/programet-studimore/`: narrative (duration, ECTS, outcomes, assessment), no PDFs found. One 43-page tuition PDF. The quality-assurance office has per-programme PDFs titled "Semestri dimëror 2025/2026" that could not be downloaded (the server returned an HTML page instead). |
| Universum | Curriculum per semester in HTML on each programme page; accreditation decision PDFs only. |
| Prizren (UUHP) | ~1,090 PDFs, nearly all regulations, bulletins, minutes and partnership agreements. Curricula appear only as attachments to announcements (for example `Kurrikula-AB-2025-2030-Shqip.pdf`, `Kurrikula-MN-2025-2030-Shqip.pdf`) and as AKA accreditation decisions on the quality-assurance page. |
| UP and faculties | Blocked by a Cloudflare challenge (see section 2). |
| IBCM Mitrovica | Real domain is `ibcmitrovica.eu`; the connection is reset from here. Search shows per-programme handbook PDFs (for example "BM Handbook 2025-2026"). |
| Others (Heimerer, FAMA, Tempulli, Pjetër Budi, AKSP, Islamic Faculty, RIT, Biznesi, Evolucion, AMECC) | Not yet surveyed, or the domain is unknown or unreachable from here. |

Consistent across institutions: the AKA accreditation decisions (PDF, one per programme or faculty) exist and are published both on akreditimi.rks-gov.net and on the institutions' quality pages; they state programme, level, ECTS and quota (which the AKA table already gives us) but not the course list.

Extraction check: the UBT plan PDF parses with a simple script into course rows (number, type, name, hours, ECTS, code). Semester totals come to 30 ECTS per semester, and the course codes are reliable. Course names that wrap over several lines come out garbled, so an LLM or a manual pass is needed for those.
