# Global Career Studio web app (builder, auth, dashboard, writer, letters, ATS, packs, billing config, admin local only, AI provider ready not live, increment 11)

Status: Phase 2 increment 11. This is NOT a finished product and
NOT launch ready. There are no payments, no live connected AI, and
no database is connected. Accounts, profiles, and documents are
local browser data only, clearly labelled as a temporary stand in
until Prisma validation passes and a real database is connected.
The writer, letters, ATS check, country packs, language packs,
onboarding wizard, billing config, and admin page in this app are
local features, not connected services. Billing config is
configuration and local entitlement checks only. No checkout,
payment form, or Stripe integration is working, and Stripe is on
hold per owner decision. The admin page is local only, not a
secured production admin. Country packs are guidance only, not
legal advice. Selected AI provider: Muse AI. Connected Muse AI is
ready for a key and is NOT live until the owner adds a key and
sets a budget cap. No budget cap has been set yet.

## What is in this increment

- AI provider abstraction, increment 11, provider finalized, live
  call not faked: provider logic in `lib/ai-provider-core.mjs`,
  with Muse AI as the selected provider, configured only through
  environment variables (provider name through GCS_AI_PROVIDER,
  model name through GCS_AI_MODEL, key through GCS_AI_API_KEY,
  budget cap through GCS_AI_BUDGET_CAP, variable names only, no
  value in the repo, in a test, or in a log). The status route at
  `app/api/ai-status/route.ts` returns provider, model configured,
  key configured, budget cap set, and live status only, never a
  key. The writer page at `app/writer/page.tsx` shows which
  provider is selected, shows local fallback when no key or no
  budget cap is configured, and falls back to the existing local
  rule based writer, with all guardrails unchanged: never invent
  qualifications, employers, job titles, dates, certifications,
  or achievements, missing fields are prompts, and a suggestion
  is applied only after user confirmation. No user CV text is
  sent anywhere when no key is configured. Connected Muse AI is
  NOT live until the owner adds a key and sets a budget cap, and
  that status is stated plainly in code, in this README, and in
  PROJECT_STATUS.md. AI provider tests at
  `scripts/test-ai-provider.mjs` cover provider selection,
  fallback with no key, fallback with a key but no budget cap,
  live only with both, guardrails unchanged, and no key leakage
  into output or logs.
- Legal docs completed in the repo, not published live, increment
  11, in `docs/legal/` at the project root: privacy policy, terms
  of service, refund policy, and trial and billing disclosure,
  plus a single owner to confirm list at
  `docs/legal/owner-to-confirm.md`. Each doc states plainly that
  Stripe payments are on hold, no payments are taken yet, prices
  are not set, and the refund policy takes effect only when paid
  plans are enabled. Refund window, human review turnaround, and
  human review price are explicit owner to confirm placeholders,
  never invented. Each doc notes at the top that it is finalized
  for owner review and a legal check is still recommended before
  it goes live on nvconsult.eu. Nothing in this increment was
  published to any live site.
- Human review scope, increment 11, in
  `docs/human-review-scope.md` at the project root: what human
  review covers (CV structure, wording, ATS readability, country
  pack fit, letter review), what it does not cover (no guaranteed
  job outcome, no invented history, no legal or visa advice), how
  it is requested (through the NVConsult free consultation route,
  paid support by personal invitation after the free call), and
  that free resume review and free LinkedIn review remain free
  extras. Turnaround and paid price are explicit owner to confirm
  placeholders.
- LinkedIn import decision, increment 11, in
  `docs/linkedin-import-decision.md` at the project root: no
  LinkedIn API import is built, because no permitted API path has
  been tested, and guided paste import and PDF/DOCX import remain
  the working fallbacks. No scraping, no unofficial API, and no
  claim that LinkedIn import works.
- Hosting plan for the nvconsult.eu first launch, increment 11,
  in `docs/deployment-preparation.md` section 10 at the project
  root: production build, environment variables by name only
  (including the Muse AI key variable name only, no key value),
  database, object storage, and the route options for hosting
  the Next.js app alongside WordPress nvconsult.eu (subdomain,
  path with reverse proxy, or separate hosting with links only),
  with no provider chosen and no deployment executed. Do not
  deploy anything and do not buy anything under this plan.
- Prisma retry, increment 11: validate retried once, failed again
  with the same ECONNRESET engine download error, recorded exactly
  in `prisma/README.md` and in `docs/deployment-preparation.md`
  section 1. Provider was NOT changed to SQLite, no migration was
  run, and all accounts, drafts, and admin state stay local
  browser data only, clearly labelled.
- Admin dashboard, local only, in increment 10, at
  `app/admin/page.tsx`, with logic in `lib/admin-core.mjs`. It

- Admin dashboard, local only, in increment 10, at
  `app/admin/page.tsx`, with logic in `lib/admin-core.mjs`. It
  lists aggregated counts only: local documents by template, by
  country pack, and by plan. No CV text, no user names, no emails,
  and no document content are shown, and none are written to the
  audit log. Versioning controls for templates, prompts, and
  country packs use config objects with version, preview, publish,
  and rollback actions that change only the local config in this
  browser, clearly labelled. Every admin action needs a reason and
  is written to a local audit log with action, time, and reason,
  with emails and secret style values sanitised from the summary.
  Feature flags for writer, letters, ATS, packs, and onboarding
  can be turned on or off locally, with the change logged. The
  page states plainly that it is local only, not a secured
  production admin, until a real database and real admin auth are
  connected. The admin page is linked from the edition aware
  header as Admin, local only.
- Full automated testing in increment 10: a single runner at
  `scripts/run-all-tests.mjs` runs every suite in order (template
  engine, builder, import, auth, writer, packs, billing, admin, and
  end to end smoke), reports pass and fail counts per suite, and
  exits non zero on any failure. Admin tests at
  `scripts/test-admin.mjs` cover aggregated counts with no CV
  content leaked, version publish and rollback, feature flag on
  and off, and audit log entries with no secrets. An end to end
  smoke test at `scripts/test-e2e-smoke.mjs` walks a local visitor
  flow with local data only, reusing the existing core modules:
  onboarding suggestion, builder draft, template switch, country
  pack application, writer suggestion with confirmation, letter
  generation, ATS check, and export through the real engine.
- Deployment preparation, docs only, in increment 10, at
  `docs/deployment-preparation.md` in the project root. It lists,
  in order, what must happen before any real deployment: Prisma
  validate and test migration passing elsewhere, real Postgres,
  object storage and hosting choices, Stripe account and VAT
  confirmation, AI provider choice and budget cap, domain choice,
  legal wording with legal check, human review scope, and a launch
  checklist with guest verification, mobile check, and full click
  through. Nothing was deployed, bought, or created as a live
  account, and the doc is not a launch approval.
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
- Local writer, letter studio, and heuristic ATS check in increment 7:
  local writer at `app/writer/page.tsx` with rule based rewrites in
  `lib/writer-core.mjs`, shown beside the original and applied only
  after the user confirms, with missing fields reported as prompts,
  never filled in, and no text sent anywhere. Letter studio at
  `app/letters/page.tsx` with 12 letter types (cover, motivation,
  reference, recommendation, employment verification, resignation,
  follow up, thank you, job application email, LinkedIn About, bio,
  personal statement), generated from user supplied fields only,
  editable before export, saved locally, and exported to PDF and
  DOCX through the template engine letter export in
  `packages/template-engine/src/exports/letter.ts` via
  `app/api/letter-export/route.ts`. Heuristic ATS check at
  `app/ats/page.tsx` with keyword overlap against a pasted job
  description, section presence, contact presence, template parse
  friendliness, and text order, stated plainly as a heuristic check,
  not a real ATS, with no pass or fail result and no guaranteed
  outcome. The pasted job description is page state only, never
  saved and never sent.
- Monetization config, entitlement enforcement, and subscription page in increment 9:
  billing config at `lib/billing-core.mjs` for Free, Premium, and Trial as
  configurable plan objects. Price, currency, and Stripe product ids are
  null placeholders only, decided later by the owner, never invented
  prices. Free allows 3 templates (ATS Minimal, Modern Professional,
  European), 2 documents, basic AI, cover letters only, and PDF export
  only. Premium and Trial allow all 10 templates, full letters, advanced
  AI in config, and PDF and DOCX export. PNG is not listed, because no
  PNG export route is built yet. Trial config is 7 days, no card, one
  trial per account, all configurable in the same file. Downgrade
  behaviour keeps viewing and downloading documents already created,
  and locks premium editing, premium templates, and premium exports.
  The builder, writer, and letters pages show the local plan and plain
  locked explanations, and the builder and letter export routes enforce
  the plan when a plan is supplied, returning 403 with a plain reason
  for a locked template or format. A document opened from the
  dashboard, or flagged as already created, stays viewable and
  downloadable after downgrade. The subscription page at
  `app/subscription/page.tsx` shows the current plan, trial status and
  end date, entitlements, and downgrade behaviour in plain language,
  with local only trial start, local cancel, and local move to Free
  actions. Local cancel keeps trial access until the trial end date,
  then moves to Free, and never charges or contacts a payment provider.
  Billing, VAT, invoices, and the refund policy are stated as not final
  on that page and will be published before launch. The subscription
  page is linked from the dashboard and from the edition aware header,
  which is unchanged except for the new link. Entitlements are local
  browser state only, in `gcs-subscription`, until a real database and
  Stripe are connected. The same free tier applies to everyone, in both
  editions, with no second public price list.
- Country packs, language packs, and onboarding wizard in increment 8:
  country packs at `lib/packs-core.mjs` for US, Canada, UK, Germany,
  Europe, Australia, New Zealand, and Global/Universal, each with
  recommended templates, photo guidance, section order, paper size,
  source notes, and a project review date of 2026-11-04, stated as
  guidance only, not legal advice, with no fee, deadline, visa rule,
  or legal requirement claimed. A country pack selector on the builder
  page applies the pack, and every applied setting can be changed
  afterwards. Language packs for English, German, French, and Spanish
  translate interface labels and preview section headings only, are
  labelled not professionally verified, and never auto translate user
  CV content. Chinese (Simplified) is not in this version and stays
  behind its demand gate. The onboarding wizard at
  `app/onboarding/page.tsx` asks country, occupation, and document
  goal, then shows a template and pack suggestion that the user can
  change in the builder, with Back and Skip controls on every step
  and a single column layout on phones.
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
npm run test:all
```

`npm run test:all` runs every suite through
`scripts/run-all-tests.mjs` and exits non zero on any failure.
Individual suites can still be run on their own:

```
npm run test:builder
npm run test:import
npm run test:auth
npm run test:writer
npm run test:packs
npm run test:billing
npm run test:admin
npm run test:ai
npm run test:e2e
```

In increment 11, typecheck passed with no failure, the single test
runner passed 202 of 202 across 10 suites (template engine 64 of 64,
builder 25 of 25, import 6 of 6, auth 12 of 12, writer 15 of 15,
packs 20 of 20, billing 21 of 21, admin 19 of 19, ai provider 9 of 9,
end to end smoke 11 of 11), and the production build passed for both
editions (commercial routes `/`, `/admin` 3.24 kB, `/builder`
13.1 kB, `/dashboard` 5.38 kB, `/auth` 4.97 kB, `/profile` 3.54 kB,
`/writer` 7.5 kB, `/letters` 7.52 kB, `/ats` 4.91 kB, `/onboarding`
3.56 kB, `/subscription` 4.15 kB, plus `/api/ai-status`,
`/api/export`, `/api/import`, `/api/letter-export`, and `/api/auth`;
nvconsult routes `/admin` 3.24 kB, `/dashboard` 4.6 kB and `/auth`
4.16 kB, same other routes). A live server test returned the
ai-status JSON with provider Muse AI, mode local-fallback, live
false, and writer page 200. The test server was stopped after the
test.
In increment 10, typecheck passed with no failure, the single test
runner passed 193 of 193 across 9 suites (template engine 64 of 64,
builder 25 of 25, import 6 of 6, auth 12 of 12, writer 15 of 15,
packs 20 of 20, billing 21 of 21, admin 19 of 19, end to end smoke
11 of 11, with a smoke PDF of 2,160 bytes and a smoke DOCX of 7,921
bytes), and the production build passed for both editions
(commercial routes `/`, `/admin` 3.24 kB, `/builder` 13.1 kB,
`/dashboard` 5.38 kB, `/auth` 4.97 kB, `/profile` 3.54 kB,
`/writer` 7.27 kB, `/letters` 7.52 kB, `/ats` 4.91 kB, `/onboarding`
3.56 kB, `/subscription` 4.15 kB, plus `/api/export`, `/api/import`,
`/api/letter-export`, and `/api/auth`; nvconsult routes `/admin`
3.24 kB, `/dashboard` 4.6 kB and `/auth` 4.16 kB, same other routes).
A live server test returned 200 for the admin page, with the
"Admin, local only" heading and the aggregated counts section
present. The test server was stopped after the test.
In increment 9, typecheck passed after one real failure was fixed, not
hidden: the new export routes first imported the billing core with a
path that resolved inside `app/`, which TypeScript rejected, so the
import path was corrected to the web app `lib/` folder. The production
build passed for both editions (commercial routes `/`, `/builder`
13.1 kB, `/dashboard` 5.38 kB, `/auth` 4.97 kB, `/profile` 3.54 kB,
`/writer` 7.27 kB, `/letters` 7.52 kB, `/ats` 4.91 kB, `/onboarding`
3.56 kB, `/subscription` 4.15 kB, plus `/api/export`, `/api/import`,
`/api/letter-export`, and `/api/auth`; nvconsult routes `/dashboard`
4.6 kB and `/auth` 4.16 kB, same other routes), the builder test
passed 25 of 25, the import test passed 6 of 6, the auth test passed
12 of 12, the writer test passed 15 of 15, the packs test passed 20
of 20, the billing test passed 21 of 21, and the template engine test
passed 64 of 64. A live server test returned 200 for the subscription
page, 403 for a Free export of a premium template, 200 at 1,652 bytes
for a Free PDF export of a free template, and 200 at 7,759 bytes for
a Trial DOCX export of a premium template. The test server was
stopped after the test.
In increment 8, typecheck passed after one real failure was fixed, not
hidden: the new builder code indexed a language pack section title map
with a plain string, which TypeScript rejected, so the pack values are
now typed as any in the builder page, and the country pack value is
typed the same way. The production build passed for both editions
(routes `/`, `/builder` 10.8 kB, `/dashboard` 5.31 kB commercial and
4.52 kB nvconsult, `/auth` 4.97 kB commercial and 4.16 kB nvconsult,
`/profile` 3.54 kB, `/writer` 5.21 kB, `/letters` 5.38 kB,
`/ats` 4.91 kB, `/onboarding` 3.56 kB, plus `/api/export`,
`/api/import`, `/api/letter-export`, and `/api/auth`), the builder
test passed 25 of 25, the import test passed 6 of 6, the auth test
passed 12 of 12, the writer test passed 15 of 15, the packs test
passed 20 of 20, and the template engine test passed 64 of 64. A live
server test returned 200 for the onboarding page and 200 for the
builder page, and the onboarding page contained its heading. The test
server was stopped after the test.
The dashboard layout is one column on phones, two columns on tablets,
and three columns on desktops.

## Structure

- `app/layout.tsx`: shared layout with the edition aware header.
- `app/page.tsx`: home page.
- `app/dashboard/page.tsx`: working local dashboard, listing local
  drafts and job versions, with open in builder, duplicate, rename,
  and delete with confirmation, plus links to the local writer, the
  letter studio, and the heuristic ATS check. AI credits,
  subscription, and human review are still not yet connected
  placeholders on this page.
- `app/writer/page.tsx`: local drafting assistance, rewrites shown
  beside the original and applied only after confirmation.
- `app/letters/page.tsx`: letter studio with 12 letter types,
  editable generated text, local save, and PDF and DOCX export.
- `app/ats/page.tsx`: heuristic ATS check, keyword overlap, section
  and contact presence, template parse note, and text order.
- `app/api/letter-export/route.ts`: letter PDF and DOCX export
  through the template engine.
- `lib/writer-core.mjs`: writer, letter, and ATS logic, tested with
  plain Node.
- `scripts/test-writer.mjs`: writer, letter, and ATS tests, plus a
  real engine letter export check.
- `app/auth/page.tsx`: local account page, signup, login, logout,
  and password reset, hashed passwords only.
- `app/profile/page.tsx`: master profile editor, with load from
  builder draft, save back with confirmation, and use in builder.
- `app/api/auth/route.ts`: auth API structure only, local only, 501,
  because no database is connected.
- `app/onboarding/page.tsx`: onboarding wizard, country, occupation,
  and goal, with a suggestion that the user can change in the builder.
- `lib/packs-core.mjs`: country packs for 8 version 1 markets and
  language packs for 4 version 1 languages, plus pack application and
  onboarding recommendation logic, tested with plain Node.
- `scripts/test-packs.mjs`: country pack, language pack, pack
  application and override, and onboarding recommendation tests.
- `lib/billing-core.mjs`: billing config and entitlement logic for
  Free, Premium, and Trial, with trial, downgrade, cancel, and export
  enforcement helpers, tested with plain Node.
- `scripts/test-billing.mjs`: billing tests for free and trial
  entitlements, trial start and expiry, one trial per account, local
  cancel, downgrade view and download kept, and export enforcement,
  plus one real engine PDF for an allowed free export.
- `app/subscription/page.tsx`: subscription page, placeholder billing
  only, with current plan, trial status, entitlements, downgrade
  behaviour, and local only trial, cancel, and move to Free actions.
- `app/admin/page.tsx`: admin page, local only, with aggregated
  counts, versioning controls, feature flags, and a local audit log.
- `lib/admin-core.mjs`: admin logic, tested with plain Node, with
  aggregated counts, config versioning, feature flags, and audit
  logging, and no CV content or secrets stored.
- `scripts/run-all-tests.mjs`: single test runner for all 9 suites,
  with per suite pass and fail counts, exiting non zero on failure.
- `scripts/test-admin.mjs`: admin tests for counts, versioning,
  flags, and audit entries.
- `lib/ai-provider-core.mjs`: Muse AI provider abstraction, env
  only config, safe status, local fallback, and secret redaction,
  tested with plain Node, no live call, no key in output or logs.
- `scripts/test-ai-provider.mjs`: AI provider tests for selection,
  fallback, live gate, guardrails, and no key leakage.
- `app/api/ai-status/route.ts`: safe AI status route, provider and
  live status only, never a key.
- `scripts/test-e2e-smoke.mjs`: end to end smoke test for one local
  visitor flow, reusing the existing core modules and the real
  template engine for export.
- `app/builder/page.tsx`: working builder, local drafts only, with
  PDF/DOCX file import, job specific versions, a country pack and
  language selector, onboarding suggestion application, and local
  plan and entitlement gating for templates and exports.
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
