# Global Career Studio web app (builder, increment 3)

Status: Phase 2 increment 3 builder only. This is NOT a finished
product. There are no accounts, payments, AI features, letters, ATS
analysis, or country packs in this app, and no database is connected.
Drafts are local browser drafts only, clearly labelled as a temporary
stand in until Prisma validation passes and a real database is
connected.

## What is in this increment

- CV builder at `app/builder/page.tsx`, linked from the dashboard.
  Edit personal details, summary, experience, education, skills, and
  languages. Add jobs, education, and custom sections. Reorder sections
  with Move up and Move down buttons, which work on phones too. Switch
  between ATS Minimal and Modern Professional only, choose A4 or US
  Letter, and set the photo flag (honoured by Modern Professional only,
  not by ATS Minimal by design). A live preview shows section order and
  content, with the template styling difference.
- Autosave and versions: drafts autosave to browser localStorage with a
  visible saved state, and saved versions can be restored from the
  version history list on the builder page. Versions are local only.
- Guided paste import on the builder page: paste structured text, or
  upload a plain text file, parse it, check and correct the parsed
  fields, and only then apply it as a draft. Unparsed lines are shown,
  never silently dropped. PDF and DOCX import is planned, not
  implemented in this increment, and the page says so plainly.
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
```

In increment 3, typecheck passed, the production build passed for both
editions (routes `/`, `/builder` 6.05 kB, `/dashboard`, 87.4 kB first
load JS on home and dashboard), the builder test passed 11 of 11, and
the template engine test passed 10 of 10. The dashboard layout is one
column on phones, two columns on tablets, and three columns on desktops.

## Structure

- `app/layout.tsx`: shared layout with the edition aware header.
- `app/page.tsx`: home page.
- `app/dashboard/page.tsx`: dashboard shell, placeholders only, with a
  link to the builder.
- `app/builder/page.tsx`: working builder, local drafts only.
- `app/api/export/route.ts`: PDF and DOCX export through the real
  template engine.
- `app/components/EditionHeader.tsx` and `app/components/PlaceholderCard.tsx`.
- `app/globals.css`, `tailwind.config.js`, `postcss.config.js`: styling setup.
- `lib/config.ts`: edition configuration and placeholder flags only.
  Values there are NOT prices, trial offers, or limits. Real values come
  from admin configuration in later phases.
- `lib/design-tokens.ts`: design tokens.
- `lib/builder-core.mjs`: builder logic, tested with plain Node.
- `scripts/test-builder.mjs`: builder tests, including real engine
  export with a custom section.

## Extend

Add real features only in the order in PROJECT_STATUS.md, and only after
the open decisions (price, Stripe, AI provider, domain on hold, hosting,
legal) are recorded. Do not hard code copy, prices, or limits in UI
components. Put configurable copy and limits behind configuration or
admin data.
