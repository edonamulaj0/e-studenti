# Phase 1: course lists from UBT, Peja, Mitrovica, Gjakova, Prizren and Ferizaj (Biznesi unavailable)

First extraction run (2026-10-11). Files here:

| File | Contents |
|---|---|
| `ubt-courses.csv`, `ubt-programmes.csv` | 2,387 course rows from 58 UBT programme-campuses |
| `peja-courses.csv`, `peja-documents.csv` | 643 course rows from 27 documents of the University "Haxhi Zeka" |
| `mitrovica-courses.csv`, `mitrovica-documents.csv` | 578 course rows from 18 documents of the University "Isa Boletini" |

Every row has its source URL and, where the programme could be matched to the AKA list, the `directory_ids` of `app/data/universities.json` it belongs to (a programme offered on several campuses lists each campus separately).

## Quality, honestly

**UBT** (English programme pages, "Curriculum structure"): the course tables were parsed from the HTML, the Management, Business and Economics plan from its three campus PDFs (Prishtinë, Ferizaj, Prizren, with course codes). Check used: the mandatory ECTS of each semester should sum to about 30. 42 of 58 programme-campuses pass for at least two semesters; the rest are flagged `needs_review` in `ubt-programmes.csv` (usually elective lists or specialisation blocks mixed in). Four have no list at all: Architecture Ferizaj and Prizren (same programme as Prishtinë, not repeated on the site), Modern Music and Radiology Technician (no list on the page). 50 of 58 matched to an AKA programme; three have no match yet.

**Peja:** the documents list course **names per year only**, with no ECTS, semester or hours (24 of 27). Two programmes are Albanian/Bosnian duplicates of each other. Three documents contain no course list (Human Resource Management, General Law LLB, a performing-arts summary). 26 of 27 matched to an AKA programme. The numbered-list parser may pick up the occasional non-course line.

**Mitrovica:** 13 of 18 documents pass the semester-sum check (code, status, hours and ECTS present). Two are scanned images (2013-2016 education programmes) that need OCR; two give names only. 9 of 18 are matched to an AKA programme (the education and economics curricula need manual mapping).

**Biznesi:** nothing extracted. The curriculum PDFs the site links to (`/Bachelor/Materialet/PDF2/Kurrikula.pdf` and the others) return 404, and the programme and syllabus pages carry no course lists in their HTML.

## Gjakova, Prizren, Ferizaj (second run)

| File | Rows | Source | Quality |
|---|---|---|---|
| `gjakova-courses.csv`, `gjakova-documents.csv` | 715 | The faculties' "Syllabuset" pages (`/syllabuset/<n>/...`, 21 programme pages; the same pages are served by every faculty subdomain) | Year and semester headings are reliable. **Course names only**: no ECTS (each course links to its own syllabus PDF, column `syllabus`). 11 of the 21 pages match an accredited AKA programme; the rest are older or non-accredited programmes (Midwifery, Nursing, Physiotherapy, Pre-school education and others) and are kept without a link. |
| `prizren-courses.csv`, `prizren-documents.csv` | 710 | Syllabus pages of the faculties (course list per year and semester, one syllabus PDF per course) plus the Education faculty's curriculum PDFs | Names only, no ECTS. Year and semester come from the page headings, or from the syllabus file numbering (`2.3.1` = year 2, semester 3) when a page has none. 16 of 23 documents are matched to an AKA programme. Some pages carry the Bosnian or Turkish variant of a programme and some programmes have two plan versions; the page with the most courses is used. The Faculty of Law master page and the Education master PDF could not be matched with confidence. |
| `ferizaj-courses.csv`, `ferizaj-documents.csv` | 549 | The "Planprogrami dhe Syllabuset" page of each programme (tables with type O/Z, hours and ECTS) | Best quality of the three. 8 of the 10 accredited programmes are covered (Interior Architecture and Green Architecture have no page). Where a page holds two plan versions, the one whose mandatory ECTS is closest to the programme total is used; older "2022/2023" pages are kept but not linked. |

Total after this run: 118 programmes with course lists, 4,457 courses.

## Small colleges (third run)

| File | Rows | Source | Quality |
|---|---|---|---|
| `universum-courses.csv`, `universum-documents.csv` | 697 | Programme pages of universum-ks.org (curriculum drawer: year, semester, course, ECTS; "elective (choose N)" lines are split into one elective row each) | Good: year, semester and ECTS present. 28 of the 38 pages match an accredited AKA programme. |
| `aab-courses.csv`, `aab-documents.csv` | 1,526 | Programme pages of aab-edu.net (accordion per year, course title with ECTS) | Year and ECTS present, semester not given. 41 of 50 programmes match an AKA programme. The "Programim.pdf" downloads return HTML (hotlink protection) and are ignored. |
| `amecc-courses.csv`, `amecc-documents.csv` | 34 | Student handbooks of Rezonanca (MSc Pharmacy; MSc Health Management and Health Economics) | Transcribed from the semester tables; mandatory courses with ECTS, electives as one placeholder row per semester. |

**Not extractable:** Tempulli (Wix, course lists load via JavaScript), Heimerer, FAMA, Pjetër Budi and IBCM (domain unknown or unreachable from here), Evolucion and RIT Kosovo (only general handbooks without per-programme course tables).

Total on the site now: 181 programmes with course lists, 6,641 courses.

## Not done yet

- Names are as written in the sources (Albanian or English). Merging them with the subject names students use on uploads is a later step.
- Manual review of the flagged programmes.
- OCR for the scanned documents; UP (blocked by a Cloudflare challenge), Biznesi (dead links), IBCM and the colleges listed above.

## On the site

`node scripts/build-curricula-data.mjs` turns these CSVs into `app/data/courses.json` (181 programmes, 6,641 courses). The site does not show the course lists on programme or comparison pages. They feed the subject suggestions on the upload and edit forms: while someone types a subject, the matching course names of the selected university (plus subjects that already have materials) are listed to pick from (`app/lib/subject-suggestions.js`, `app/components/SubjectInput.js`). The data file loads only when the field is focused.
