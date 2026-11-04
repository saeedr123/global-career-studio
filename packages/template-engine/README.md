# Template engine (Phase 2 increment 1)

Proof only. Two templates only: ATS Minimal and Modern Professional.
No accounts, payments, AI, dashboard, letters, ATS analysis, or country
packs live in this package.

## What it proves

- A rendering abstraction: one sample candidate profile renders through
  either template, with A4 or US Letter, single or two page intent, a
  photo flag, and a custom section order.
- PDF export with selectable text, not an image.
- DOCX export with real headings, paragraphs, and lists, not a PDF image
  inside Word.
- Pagination: the long sample forces a second PDF page at readable sizes,
  instead of clipping, overlapping, or shrinking text.

## Distinctness

ATS Minimal and Modern Professional differ in layout structure, section
presentation, and typography, not only in colour. ATS Minimal is a plain
single column with uppercase standard headings and no photo. Modern
Professional has a navy header block, larger headings, and an accent line
under each heading, and it allows a photo placeholder.

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

`npm test` builds the TypeScript, then runs the export test. The test
generates, for both templates, a short sample and a long sample in PDF
and DOCX, checks that each file exists and is not empty, checks that PDF
text extraction and DOCX text both contain the sample name and job title,
checks that the long PDF has at least two pages, and prints PASS or FAIL
per case. Output files go to `test-output/` in this package. That folder
is test output only and is not part of the pushed proof list unless a
later step decides to keep a sample.

## Extend

To add a template, add a definition in `src/templates.ts`, add its
rendering branch in `src/exports/pdf.ts` and `src/exports/docx.ts`, and
add its cases to `src/test/run-exports-test.ts`. Do not claim a new
template works until its export test passes and its output has been
inspected. Do not add prices, guaranteed ATS claims, or fabricated
qualifications to any template or sample.
