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

## 3. Still to do

- Full source inventory for the 21 institutions (programme page, plan, fees, syllabi per programme).
- Fees and syllabi search for the three pilot institutions.
- End-to-end extraction of a few programmes with checks against the source.
- Cost estimate and recommendation.
