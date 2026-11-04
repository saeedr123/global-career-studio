# LinkedIn import: decision, Phase 2 increment 11

Status: Decided in increment 11, repo only. No LinkedIn API import
is built, and no LinkedIn import is claimed as working.

## Decision

No LinkedIn API import is built in this increment, because no
permitted API path has been tested. Until a permitted path is
tested with evidence, LinkedIn import stays unbuilt.

## What is NOT built, and must not be claimed

- No LinkedIn API import.
- No scraping of LinkedIn pages or profiles.
- No unofficial API, browser automation against LinkedIn, or
  workaround that pretends to be a permitted import.
- No claim, in UI copy, docs, or marketing, that LinkedIn import
  works, is connected, or is coming on a stated date. No date is
  promised here.

## Working fallbacks, unchanged

- Guided paste import on the builder page: paste structured text,
  check and correct the parsed fields, and only then apply it as
  a draft. Unparsed lines are shown, never silently dropped.
- Plain text file upload on the builder page, with the same
  correction step.
- PDF and DOCX import through the import API, with text extraction
  and a correction step before the import becomes a draft. A file
  with no readable text is reported as empty, with no content
  invented.

These fallbacks remain the working import routes, and the builder
page already states plainly that LinkedIn import is not built.

## What would be needed to reopen this decision

- A permitted LinkedIn API path, named in writing, with its terms
  and access requirements.
- A test of that path, with evidence, using test data only, not a
  real user's LinkedIn profile.
- Owner approval to build it, after that test, with the same
  correction step as the other imports, so no imported field
  becomes a draft until the user checks it.

Until those three steps are done, this decision stands, and
LinkedIn import remains in the remaining work list as not done,
not as partially built.
