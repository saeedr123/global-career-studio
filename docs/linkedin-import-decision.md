# LinkedIn import: decision and export import, Phase 2 increment 12

Status: Export import built in increment 12, repo only, not live.
LinkedIn API import is still NOT built. No scraping, no unofficial
API, and no claim that an API import works.

## Decision, unchanged from increment 11

No LinkedIn API import is built, because no permitted API path has
been tested. Until a permitted path is tested with evidence,
LinkedIn API import stays unbuilt.

## What is now built: official data export import

In increment 12, LinkedIn import by official data export is built,
following the exact pattern of the existing PDF and DOCX import:
upload, parse, show parsed fields for correction with warnings and
unparsed items never silently dropped, and only become a draft
after user confirmation.

The user flow, documented on the builder page, is: LinkedIn on
desktop, Settings and Privacy, Data Privacy, Get a copy of your
data, pick at least Profile, Positions, Education, Skills,
Certifications, and Languages, request the archive, unzip it, and
upload the CSV files here. Studio does not contact LinkedIn, does
not scrape, and does not use an unofficial API.

Implementation, increment 12:

- Parser in apps/web/lib/linkedin-core.mjs: a proper CSV parser
  for quoted fields, embedded commas, embedded newlines, and
  multiline descriptions, never a naive split on commas.
- Mapping, with missing columns handled gracefully and warned
  about, never invented: Profile.csv (First Name, Last Name,
  Headline, Summary, Geo Location) to personal details and
  summary; Positions.csv (Company Name, Title, Description,
  Location, Started On, Finished On, where an empty Finished On
  means a current role) to experience; Education.csv (School
  Name, Start Date, End Date, Degree Name, Notes, Activities)
  to education, with Notes and Activities kept in an Education
  notes custom section so they are not dropped; Skills.csv to
  skills; Certifications.csv to a custom section; Languages.csv
  to languages.
- Individual CSV uploads or a ZIP upload, extracted server side
  with adm-zip, already a template engine dependency, through a
  new helper in packages/template-engine/src/exports/file-import.ts.
  No new dependency was added.
- API route at apps/web/app/api/linkedin-import/route.ts: parses
  only, stores nothing, and makes nothing a draft.
- Builder page section at apps/web/app/builder/page.tsx: shows the
  export steps, the parsed fields for correction, warnings,
  unparsed items, files used, and files not supplied, and applies
  the import as a draft only after the user confirms. The page
  states plainly that the export contains the user's own data,
  that the profile photo is not in the export, and that dates in
  Month YYYY form are kept as written for correction.
- Tests at apps/web/scripts/test-linkedin.mjs: 10 passed, 0 failed,
  covering the full six file set, a current role with an empty
  Finished On, a quoted comma and a multiline description, a
  missing file warning, an unknown column warning, a missing
  column warning, an unparsed empty row, a ZIP of the same CSV
  files, the correction step with draft only on confirmation, and
  education notes kept in a custom section. All sample data is
  fictional and marked SAMPLE. A live server test in increment 12
  returned 200 for the import route with the correct name and a
  current role period, and 200 for the builder page with the
  LinkedIn export section present. The test server was stopped
  after the test.

## What is still NOT built, and must not be claimed

- No LinkedIn API import.
- No scraping of LinkedIn pages or profiles.
- No unofficial API, browser automation against LinkedIn, or
  workaround that pretends to be a permitted import.
- No claim, in UI copy, docs, or marketing, that LinkedIn import
  is connected, or that an API import is coming on a stated date.
  No date is promised here.

## Working fallbacks, unchanged, plus the new export import

- Guided paste import on the builder page: paste structured text,
  check and correct the parsed fields, and only then apply it as
  a draft. Unparsed lines are shown, never silently dropped.
- Plain text file upload on the builder page, with the same
  correction step.
- PDF and DOCX import through the import API, with text extraction
  and a correction step before the import becomes a draft. A file
  with no readable text is reported as empty, with no content
  invented.
- LinkedIn export import, new in increment 12, with the same
  correction step as the other imports, so no imported field
  becomes a draft until the user checks it.

## What would be needed to reopen the API decision

- A permitted LinkedIn API path, named in writing, with its terms
  and access requirements.
- A test of that path, with evidence, using test data only, not a
  real user's LinkedIn profile.
- Owner approval to build it, after that test, with the same
  correction step as the other imports, so no imported field
  becomes a draft until the user checks it.

Until those three steps are done, the API decision stands, and
LinkedIn API import remains in the remaining work list as not done,
not as partially built.
