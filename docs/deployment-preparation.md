# Deployment preparation

Status: docs only, Phase 2 increment 12. This document is NOT a
launch approval, and nothing in it deploys, buys, or creates any
live account. The product is NOT launch ready. Do the steps below,
in order, and recheck each one with evidence, before any real
deployment is attempted.

## 1. Prisma validate and test migration passing elsewhere

Prisma validation and migration have NOT passed in this workspace.
In increments 1, 2, 3, and 11, the Prisma engine download failed with
ECONNRESET, and no migration was run. Increment 11 retry, once, in a
clean temporary folder, Node v24.22.1, npm 10.9.4, prisma@6.14.0
install succeeded with 35 packages, validate exit 1, exact error:
Error aborted, at TLSSocket.socketCloseListener, code ECONNRESET,
attemptNumber 1, retriesLeft 2. The provider was NOT changed
to SQLite as a workaround, and no migration was run in increment 11.
In increment 12, a GitHub Actions workflow was added at
.github/workflows/prisma-validate.yml to run validate, generate,
and db push against an ephemeral Postgres service container on
GitHub, because this environment cannot run GitHub Actions or
check a run status. That workflow is pushed, and its first CI run
is pending on GitHub, NOT claimed as passed. The provider was NOT
changed to SQLite, checksums were NOT ignored, and no migration
was run against any real database in increment 12.
All accounts, drafts, job versions, letters, and admin state remain
local browser data only, clearly labelled. Before any deployment:

- Run Prisma validate on a machine where the engine download works.
- Run a test migration against a test database, not production data.
- Generate the Prisma client from the validated schema.
- Record the validate output, the migration output, and the test
  database result. A structural check of the schema file is not a
  substitute for this step.

## 2. Real Postgres

- Choose a Postgres host and region, with backups and a restore
  test, before any user data is stored there.
- Move local browser accounts, profiles, drafts, job versions, and
  letters to the real database through the planned data layer
  change, keeping the same account and session shapes.
- Confirm account deletion removes photos, exports, and AI logs,
  with the backup expiry statement published alongside it.
- Confirm admin access to user documents is logged, for support
  with a recorded reason only, and that audit logs contain no CV
  content and no secrets.

## 3. Object storage and hosting choices

- Choose object storage for photos and exports, with access rules
  that keep one user's files private from other users.
- Choose hosting for the web app, with a staging environment that
  is separate from production. See section 10 for the hosting plan
  for the nvconsult.eu first launch, completed in increment 11 as a
  plan only, with no provider chosen and no deployment executed.
- Record the data location for GDPR purposes, and confirm it
  matches what the privacy wording will say. The data location is
  still OWNER TO CONFIRM, see docs/legal/owner-to-confirm.md.
- Check for a newer patched Next.js release before deployment,
  because an earlier 14.2.18 install warned about a security
  vulnerability, and the app now uses a patched 14.2.35 release.

## 4. Stripe account and VAT confirmation

- Open a Stripe account only when the owner decides to do so. No
  Stripe account, product, price, or checkout exists in this code.
- Confirm the price, currency, and billing products for each
  edition, with separate billing products per edition even on the
  same Stripe account, as required by the split ready rules.
- Confirm VAT treatment, invoicing, and the refund policy, and
  publish them before launch. Do not invent any price, VAT rate,
  or refund term in code or copy until the owner confirms it.
- Replace the local only subscription page with real checkout and
  real subscription state, and retest entitlement enforcement
  against real Stripe state, not local browser flags.

## 5. AI provider choice and budget cap

- Provider decided in increment 11: Muse AI. Connected Muse AI is
  ready for a key and is NOT live until the owner adds a key and
  sets a budget cap. The writer page shows the provider selected
  and falls back to the existing local rule based writer when no
  key is configured, and no user CV text is sent anywhere until
  then. No live AI call is faked in increment 11.
- Set a budget cap and a per user allowance before connected AI
  is enabled, and record both in admin configuration, not in
  hard coded copy. No budget cap has been set yet, so the owner
  must set one before enabling live calls. Key variable name only:
  GCS_AI_API_KEY. Model name is configurable through GCS_AI_MODEL.
  Budget cap variable name only: GCS_AI_BUDGET_CAP. No key value
  is stored in the repo, in a test, or in a log.
- Confirm that no training on user CVs happens without separate
  explicit consent, and that aggregated analytics never read CV
  text.
- Retest writer, letters, and ATS behaviour with the connected
  provider, keeping the same guardrails: no invented employer,
  job title, date, certification, qualification, or achievement,
  and user confirmation before any rewrite is applied.

## 6. Domain choice

- First launch is on nvconsult.eu, per owner decision. A separate
  domain is added later. Do not check domain availability and do
  not purchase any domain until the owner chooses one.
- When a separate domain is chosen, record it, the nvconsult.eu
  link locations, and the entry points for each edition, before DNS
  or hosting is changed. See section 10 for the route options for
  hosting the Next.js app alongside WordPress nvconsult.eu.

## 7. Legal wording with legal check

- Privacy, terms, refund policy, and trial and billing disclosure
  wording are completed in the repo in increment 11, in docs/legal/,
  finalized for owner review only, and must NOT be published as
  final yet, and must NOT be published on any live site yet.
  Each doc states plainly that Stripe payments are on hold, no
  payments are taken yet, prices are not set, and the refund policy
  takes effect only when paid plans are enabled. Refund window,
  human review turnaround, and human review price are explicit
  owner to confirm placeholders, listed in one place in
  docs/legal/owner-to-confirm.md, never invented.
- Get a legal check on privacy, terms, trial disclosure, billing
  disclosure, and the refund policy, and publish only the checked
  versions.
- Human review scope is completed in increment 11, in
  docs/human-review-scope.md, with turnaround and price as explicit
  owner to confirm placeholders. Publish only the scope and
  turnaround the owner confirms.

## 8. Remaining Phase 2 work before launch

These items are still undone, and launch must wait for them:

- LinkedIn import: export import built in increment 12, API import
  still not built, because no permitted API path has been tested,
  see docs/linkedin-import-decision.md. Guided paste import and
  PDF/DOCX import remain working fallbacks, plus export import.
- Connected AI generation: provider decided as Muse AI in
  increment 11, but NOT live, because no key and no budget cap
  have been set. Live calls, key, and budget cap remain.
- Real Stripe payments, with confirmed price, VAT, and refund terms.
  Stripe is on hold per owner decision, to be added later.
- Real database, with Prisma validate and a test migration passing.
  Increment 11 retry still failed with ECONNRESET, see section 1.
- Real admin auth, replacing the local only admin page in this
  increment, which must never be presented as a secured production
  admin.
- Hosting provider choice, legal check before live, and the full
  launch checklist in section 9.

## 9. Launch checklist

Run every item below, with evidence, before launch, and do not
skip an item because an earlier increment passed it:

- Guest verification on the live frontend, logged out, after
  purging every cache layer. Preview checks do not count.
- Mobile check: one column layout on phones, working section
  reorder, template switch, and export on a phone sized view.
- Full click through: home, onboarding, builder, writer, letters,
  ATS check, dashboard, profile, account, subscription, and admin
  pages, in both editions, commercial and nvconsult.
- Export click through: PDF and DOCX for each of the 10 version 1
  templates, at A4 and US Letter, with a custom section included.
- Import click through: guided paste, plain text file, PDF, and
  DOCX, with the correction step, and an empty file reported as
  empty, with no content invented.
- Entitlement click through: Free locks premium templates and
  DOCX, Trial unlocks them locally only until real Stripe state
  replaces the local flag, and already created documents stay
  viewable and downloadable after downgrade.
- Accessibility and copy check: no invented price, no guaranteed
  ATS claim, no fabricated qualification, and no em dash or en
  dash in new or changed files, per project copy rules.
- Full test run through the single runner, with every suite
  passing, plus a production build passing for both editions.
- Backup and rollback plan: a current backup, a tested restore,
  and a rollback step for templates, prompts, and country packs
  through admin versioning, before any content change goes live.

## 10. Hosting plan for the nvconsult.eu first launch

Status: Plan only, Phase 2 increment 11. No provider is chosen,
no deployment is executed, nothing is bought, and no live
nvconsult.eu change is made under this plan. This plan must be
rechecked with evidence before any deployment step starts.

First launch location: nvconsult.eu, per owner decision. A separate
domain is added later. The NVConsult edition is the first launch
edition, built with NEXT_PUBLIC_EDITION=nvconsult. The commercial
edition is built separately, with the default edition value, when
its own entry point is ready.

### Production build

- Run the production build for both editions, with
  npm run build, once with NEXT_PUBLIC_EDITION=nvconsult and once
  with the commercial default, and record the route list for each.
- Run typecheck, and run the full test runner, and require every
  suite to pass before any build is treated as deployable.
- Keep pdfkit, docx, pdfjs-dist, adm-zip, and the template engine
  external on the server, as set in apps/web/next.config.mjs, so
  live PDF and DOCX export keep working. Retest live export after
  any Next.js upgrade, because the bundling failure in increment 3
  only appeared in the live route, not in the template engine test.
- Check for a newer patched Next.js release before deployment,
  because an earlier 14.2.18 install warned about a security
  vulnerability, and the app now uses a patched 14.2.35 release.

### Environment variables, names only, no values

Set these in the hosting environment, never in the repo, never in
a test, and never in a log:

- NEXT_PUBLIC_EDITION, set to nvconsult for the first launch build.
- DATABASE_URL, pointing to the hosted Postgres test database
  first, and to production only after a test migration passes.
- GCS_AI_PROVIDER, set to Muse AI.
- GCS_AI_MODEL, model name as a configurable value, set by the
  owner.
- GCS_AI_API_KEY, Muse AI key, added by the owner only. No key
  value is stored anywhere in this repo.
- GCS_AI_BUDGET_CAP, budget cap, set by the owner before any live
  AI call. No budget cap has been set yet.
- Stripe variables: none are set in this plan, because Stripe is
  on hold. Stripe variables are added only when the owner adds
  Stripe later, with confirmed price, currency, VAT treatment, and
  refund terms.

### Database

- Use a hosted Postgres database, not a local Postgres install,
  because the Phase 1 environment check found no local Postgres.
- Run Prisma validate, then a test migration against a test
  database only, then generate the Prisma client, on a machine
  where the engine download works, before any production database
  is used. Record the validate output, the migration output, and
  the test database result.
- Move local browser accounts, profiles, drafts, job versions, and
  letters to the real database through the planned data layer
  change, keeping the same account and session shapes, and replace
  the local only admin page with real admin auth before launch.
- Confirm backups and a restore test, and confirm account deletion
  removes photos, exports, and AI logs, with the backup expiry
  statement published alongside the privacy policy.

### Object storage

- Choose object storage for photos and exports, with access rules
  that keep one user's files private from other users.
- No object storage provider is chosen in this plan. The provider
  choice, region, and data location must be recorded, and the data
  location must match what the privacy policy says, before any
  user file is stored there.

### Route options for hosting Next.js alongside WordPress nvconsult.eu

No option below is chosen, and no option is executed, in this plan.
The owner chooses one option, with the hosting provider, before any
DNS or hosting change:

- Option A, subdomain: host the Next.js app on a subdomain of
  nvconsult.eu, such as tools or app, while WordPress stays on the
  main domain. The subdomain name is OWNER TO CONFIRM, and no
  subdomain is created in this plan.
- Option B, path on the same domain: host the Next.js app under a
  path on nvconsult.eu, with WordPress serving the rest of the
  site, using a reverse proxy in front of both. The path is OWNER
  TO CONFIRM, and no proxy rule is created in this plan.
- Option C, separate hosting with links only: host the Next.js
  app on its own hosting, link to it from nvconsult.eu, and keep
  WordPress untouched except for those links. The link locations
  on nvconsult.eu are OWNER TO CONFIRM, and no link is added to
  the live site in this plan.

In every option, the live WordPress site is untouched until the
owner approves the exact change, with a backup named first, and
guest verification on the live frontend, logged out, after purging
every cache layer, is required before the change is claimed done.
Preview checks do not count.

### Staging before production

- Set up a staging environment that is separate from production,
  on the chosen hosting, before any production deployment.
- Run the full launch checklist in section 9 on staging first:
  guest verification, mobile check, full click through in both
  editions, export click through for all 10 templates at A4 and
  US Letter, import click through with the correction step,
  entitlement click through, and the full test run.
- Publish the legal docs on the live site only after the legal
  check, and only the checked versions, with the owner to confirm
  items in docs/legal/owner-to-confirm.md resolved.

## What this document does not do

This document does not approve a launch, does not set a price, a
VAT rate, a refund term, a budget cap, a separate domain, or a
hosting choice, and does not publish any legal wording. The AI
provider is decided as Muse AI in increment 11, but the key and
budget cap are not set, so connected AI is NOT live. Every other
decision still belongs to the owner, and must be recorded with
evidence before deployment starts.
