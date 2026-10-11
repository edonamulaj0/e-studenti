# Phase 1: course lists from UBT, Peja, Mitrovica and Biznesi

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

## Not done yet

- Names are as written in the sources (Albanian or English). Merging them with the subject names students use on uploads is a later step.
- Manual review of the flagged programmes.
- OCR for the scanned documents; Gjakova, Prizren, Ferizaj, UP and the small colleges.

## On the site

`node scripts/build-curricula-data.mjs` turns these CSVs into `app/data/courses.json` (83 programmes, 3,183 courses). Opening a programme on `/universitetet/<slug>` shows its courses by year and semester, with a link to the source document; `/krahaso` shows both programmes' course lists side by side. The file loads on demand, so it does not slow the other pages. Programmes without a list say so.
