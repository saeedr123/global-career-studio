# Global Career Studio web app (builder, auth, dashboard, increment 6)

Status: Phase 2 increment 6. This is NOT a finished product. There
are no payments, AI features, letters, ATS analysis, or country
packs in this app, and no database is connected. Accounts, profiles,
and documents are local browser data only, clearly labelled as a
temporary stand in until Prisma validation passes and a real database
is connected.

## What is in this increment

- CV builder at `app/builder/page.tsx`, linked from the dashboard.
  Edit personal details, summary, experience, education, skills, and
  languages. Add jobs, education, and custom sections. Reorder sections
  with Move up and Move down buttons, which work on phones too. Switch
  between all 10 version 1 templates (ATS Minimal, Modern Professional,
  Executive, Corporate, Elegant, European, US Resume, UK CV, Sidebar,
  Two-column), each with a short honest description and an ATS note in
  the builder. Sidebar and Two-column are labelled design first, not
  ATS friendly, with ATS Minimal recommended for portal uploads.
  Choose A4 or US Letter, and set the photo flag (honoured only where
  the template allows it: not ATS Minimal, US Resume, or UK CV, by
  design). A live preview shows section order and content, with the
  template styling difference, including a two column preview for
  Sidebar and Two-column.
- Autosave and versions: drafts autosave to browser localStorage with a
  visible saved state, and saved versions can be restored from the
  version history list on the builder page. Versions are local only.
- Guided paste import on the builder page: paste structured text, or
  upload a plain text file, parse it, check and correct the parsed
  fields, and only then apply it as a draft. Unparsed lines are shown,
  never silently dropped.
- PDF and DOCX import in increment 5, at `app/api/import/route.ts`:
  upload a PDF or DOCX file up to 5 MB, extract its text with the
  template engine file import module (`extractPdfText` with line
  grouping by y coordinate, `extractDocxText` by paragraph, both in
  `packages/template-engine/src/exports/file-import.ts`), parse it
  with `parseFileImport` in `lib/builder-core.mjs`, and show the
  parsed fields, warnings, and unparsed lines for correction before
  the import becomes a draft. A file with no readable text, for
  example a scanned image PDF, is reported as empty, with no content
  invented. Custom sections are detected when they follow the
  standard sections in default order; custom sections elsewhere are
  left unparsed for correction, not guessed. LinkedIn import is
  planned, not built, and guided paste is the working fallback, with
  an honest limitation note on the builder page.
- Local auth, master profile, and working dashboard in increment 6:
  account page at `app/auth/page.tsx` with signup, login, logout,
  and password reset, using hashed passwords in `lib/auth-core.mjs`
  (SHA-256 with a random salt, never plain text, localStorage only).
  The auth API at `app/api/auth/route.ts` is structure only and
  answers 501 for local only, because no database is connected, so
  it never pretends to create a server account. Master profile page
  at `app/profile/page.tsx` with one profile per account, reused
  across documents, and save back from a builder draft only after a
  confirmation prompt. Dashboard at `app/dashboard/page.tsx` now
  lists local drafts and job versions, with open in builder,
  duplicate, rename, and delete with confirmation, instead of the
  increment 2 placeholders. AI credits, subscription, and human
  review on the dashboard are still clearly labelled not yet
  connected, and are not working features. The builder page can open
  a dashboard document through `gcs-open-document`, and can save a
  draft back to the master profile only after confirmation.
- Job specific versions in increment 5, local browser drafts only:
  create a named job version from the master draft with a user typed
  job title and company, both required and never invented, edit a
  version without changing the master unless the user saves back to
  that version on purpose, compare two versions by structure
  (template, paper size, photo, section order, field counts), and
  export a version to PDF and DOCX through the real export API.
  Core logic is in `lib/builder-core.mjs` (`createJobVersion`,
  `compareJobVersions`), so it is tested with plain Node.
- Export API at `app/api/export/route.ts`: uses the real template
  engine, not a screenshot or placeholder file. PDF has selectable text
  and DOCX has real headings, paragraphs, and lists, including custom
  sections. A live server test in increment 3 returned PDF 200 at 1,892
  bytes (A4) and DOCX 200 at 7,629 bytes. The first live PDF test
  failed with ENOENT for Helvetica.afm, because Next.js bundled pdfkit
  and lost its font data folder. The fix, recorded here, is in
  `next.config.mjs`: pdfkit, docx, and the template engine are kept
  external on the server, so their package folders and data files are
  preserved. After that fix, the live PDF test passed.
- Builder core in `lib/builder-core.mjs`: pure logic for section order,
  custom sections, photo flag, draft serialisation, version history,
  profile validation, and import parsing, with no browser or database
  dependency, so it can be tested with plain Node.
- Template engine custom sections: `packages/template-engine/src` now
  supports optional custom sections on a profile, rendered in section
  order, so preview, PDF, and DOCX all include them.
- Combined now, split later design: one application now, with separate
  skins and copy per edition, modular auth planned, an edition tag in
  the database, separate billing products per edition planned, and
  separate entry points. See docs/architecture.md for the full split
  ready rules.

## Edition selection

Set the edition at build time:

```
NEXT_PUBLIC_EDITION=nvconsult npm run build
```

Use `nvconsult` for the NVConsult edition, or `commercial` (the default)
for the commercial Global Career Studio edition. The edition changes
branding, header copy, and help links only. It does not change the
template engine, the documents, or the free tier.

The tools site domain is on hold as of 4 November 2026. Use placeholder
domain configuration only. Do not check domain availability and do not
purchase anything.

## Run locally

From this folder:

```
npm install --no-bin-links
npm run dev
```

If `npm install` fails in this workspace with a chown EPERM error on a
package binary, retry with `npm install --no-bin-links`. The npm scripts
already call Next.js and TypeScript by their file paths, so they work
with either install style. Next.js is pinned to a patched 14.2.x release
after an earlier 14.2.18 install warned about a security vulnerability.

Then open the local address shown by Next.js.

## Build, typecheck, and tests

```
npm run build
npm run typecheck
npm run test:builder
npm run test:auth
```

In increment 6, typecheck passed, the production build passed for both
editions (routes `/`, `/builder` 6.71 kB, `/dashboard` 3.54 kB
commercial and 2.73 kB nvconsult, `/auth` 4.97 kB commercial and
4.16 kB nvconsult, `/profile` 1.88 kB, plus `/api/export`,
`/api/import`, and `/api/auth`), the builder test passed 25 of 25,
the import test passed 6 of 6, the auth test passed 12 of 12, and
the template engine test passed 64 of 64.
The dashboard layout is one column on phones, two columns on tablets,
and three columns on desktops.

## Structure

- `app/layout.tsx`: shared layout with the edition aware header.
- `app/page.tsx`: home page.
- `app/dashboard/page.tsx`: working local dashboard, listing local
  drafts and job versions, with open in builder, duplicate, rename,
  and delete with confirmation. AI credits, subscription, and human
  review are still not yet connected placeholders on this page.
- `app/auth/page.tsx`: local account page, signup, login, logout,
  and password reset, hashed passwords only.
- `app/profile/page.tsx`: master profile editor, with load from
  builder draft, save back with confirmation, and use in builder.
- `app/api/auth/route.ts`: auth API structure only, local only, 501,
  because no database is connected.
- `app/builder/page.tsx`: working builder, local drafts only, with
  PDF/DOCX file import and job specific versions.
- `app/api/export/route.ts`: PDF and DOCX export through the real
  template engine.
- `app/api/import/route.ts`: PDF and DOCX file import, text
  extraction and parsing only, nothing stored, nothing becomes a
  draft until the user corrects it on the builder page.
- `app/components/EditionHeader.tsx` and `app/components/PlaceholderCard.tsx`.
- `app/globals.css`, `tailwind.config.js`, `postcss.config.js`: styling setup.
- `lib/config.ts`: edition configuration and placeholder flags only.
  Values there are NOT prices, trial offers, or limits. Real values come
  from admin configuration in later phases.
- `lib/design-tokens.ts`: design tokens.
- `lib/builder-core.mjs`: builder logic, including file import
  parsing and job version logic, tested with plain Node.
- `scripts/test-builder.mjs`: builder tests, including real engine
  export with a custom section, file import parsing, and job
  versions.
- `scripts/test-import.mjs`: file import tests, using engine
  generated PDF and DOCX files, hand written PDF and DOCX files,
  empty file handling, and job version export.

## Extend

Add real features only in the order in PROJECT_STATUS.md, and only after
the open decisions (price, Stripe, AI provider, domain on hold, hosting,
legal) are recorded. Do not hard code copy, prices, or limits in UI
components. Put configurable copy and limits behind configuration or
admin data.
