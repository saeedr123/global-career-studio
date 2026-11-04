# Template engine (Phase 2 increment 4)

All 10 version 1 templates. No accounts, payments, AI, dashboard,
letters, ATS analysis, or country packs live in this package.

## Templates, with distinctness notes

Each template differs in layout structure, section order, and
typography, not only in colour. Colour variants do not count.

- ATS Minimal: single column, plain, uppercase headings, no photo, parse friendly. Recommended for portal uploads.
- Modern Professional: single column, navy header block, accent lines, larger headings, photo allowed.
- Executive: centered header, large name, Executive Summary, skills before education, photo allowed.
- Corporate: navy band header, compact spacing, experience before summary, photo allowed.
- Elegant: serif type, centered header, education before experience, photo allowed.
- European: Europass style structure only, not a copy of the official Europass visual design. Personal information header, then Work Experience, Education and Training, Language Skills, Skills, Additional Information last. Photo allowed.
- US Resume: US style, Professional Summary, experience, skills, education. No photo, by US convention.
- UK CV: UK style, Personal Profile, experience, education, skills. No photo, by UK convention.
- Sidebar: design first. Narrow left sidebar for skills and languages, wide main column for the rest, real two cell table in DOCX. Not ATS friendly.
- Two-column: design first. Wide main column on the left, narrow right column for skills and languages, real two cell table in DOCX. Not ATS friendly.

Sidebar and Two-column are labelled design first in the builder, never
ATS friendly, with ATS Minimal recommended for portal uploads. Their
visual order differs from plain text extraction order. All other
templates are single column flows with parse friendly text order.

## What it proves

- A rendering abstraction: one sample candidate profile renders through
  any of the 10 templates, with A4 or US Letter, single or two page
  intent, a photo flag where the template allows it, and a custom
  section order.
- PDF export with selectable text, not an image.
- DOCX export with real headings, paragraphs, and lists, not a PDF image
  inside Word. Sidebar and Two-column DOCX use a real editable table.
- Pagination: the long sample forces a second PDF page at readable sizes,
  instead of clipping, overlapping, or shrinking text. The long Sidebar
  PDF runs to 3 pages, because its main column is narrower. That is
  pagination, not clipping, and the test requires at least 2 pages for
  long samples, not exactly 2.

## Sample data

All sample data is fictional and marked SAMPLE in code and in output.
The sample person is Sam Sample, a fictional sample project coordinator.
Never present sample output as a real user document.

## Run and test

From this folder:

```
npm install
npm test
```

If `npm install` fails in this workspace with a chown EPERM error on a
package binary, retry with `npm install --no-bin-links`. The build script
already calls the TypeScript compiler by its file path, so it works with
either install style. PDF text in the test is extracted with pdfjs-dist.
An earlier pdf-parse attempt was dropped because it gave inconsistent
parse errors on valid PDFKit output, while pdftotext and pdfjs-dist both
read every proof PDF correctly.

`npm test` builds the TypeScript, then runs the export test. In
increment 4 the test passed 64 of 64: a distinctness check, then for
each of the 10 templates, short and long samples in PDF and DOCX at A4,
a short US Letter PDF, and a photo flag check, plus custom section
order, photo flag, and ATS Minimal text order checks. Each export case
checks that the file exists and is not empty, that PDF text extraction
and DOCX text both contain the sample name and job title, that long
PDFs have at least 2 pages, and that DOCX contains headings and, for
Sidebar and Two-column, a table. Output files go to `test-output/` in
this package. That folder is test output only and is not part of the
pushed proof list unless a later step decides to keep a sample.

## Extend

To add a template, add a definition in `src/templates.ts`, add its
rendering branch in `src/exports/pdf.ts` and `src/exports/docx.ts`, and
add its cases to `src/test/run-exports-test.ts`. Do not claim a new
template works until its export test passes and its output has been
inspected. Do not add prices, guaranteed ATS claims, or fabricated
qualifications to any template or sample.
