# Deployment preparation

Status: docs only, Phase 2 increment 10. This document is NOT a
launch approval, and nothing in it deploys, buys, or creates any
live account. The product is NOT launch ready. Do the steps below,
in order, and recheck each one with evidence, before any real
deployment is attempted.

## 1. Prisma validate and test migration passing elsewhere

Prisma validation and migration have NOT passed in this workspace.
In increments 1, 2, and 3, the Prisma engine download failed with
ECONNRESET, and no migration was run. The provider was NOT changed
to SQLite as a workaround. Before any deployment:

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
  is separate from production.
- Record the data location for GDPR purposes, and confirm it
  matches what the privacy wording will say.
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

- Choose a connected AI provider, or decide explicitly to launch
  without connected AI. The writer in this code is local rule based
  drafting assistance only, and no AI provider is connected.
- Set a budget cap and a per user allowance before connected AI
  is enabled, and record both in admin configuration, not in
  hard coded copy.
- Confirm that no training on user CVs happens without separate
  explicit consent, and that aggregated analytics never read CV
  text.
- Retest writer, letters, and ATS behaviour with the connected
  provider, keeping the same guardrails: no invented employer,
  job title, date, certification, qualification, or achievement,
  and user confirmation before any rewrite is applied.

## 6. Domain choice

- The tools site domain is on hold. Do not check domain
  availability and do not purchase any domain until the owner
  chooses one.
- When a domain is chosen, record it, the nvconsult.eu link
  locations, and the entry points for each edition, before DNS
  or hosting is changed.

## 7. Legal wording with legal check

- Privacy, terms, and refund policy wording are NOT final and
  must NOT be published as final from this code. No legal wording
  is invented in this document.
- Get a legal check on privacy, terms, trial disclosure, billing
  disclosure, and the refund policy, and publish only the checked
  versions.
- Confirm human review scope and turnaround, and publish only the
  scope and turnaround the owner confirms.

## 8. Remaining Phase 2 work before launch

These items are still undone, and launch must wait for them:

- LinkedIn import, where permitted, with guided paste import as
  the working fallback until a permitted path is tested.
- Connected AI generation, with a chosen provider and budget cap.
- Real Stripe payments, with confirmed price, VAT, and refund terms.
- Real database, with Prisma validate and a test migration passing.
- Real admin auth, replacing the local only admin page in this
  increment, which must never be presented as a secured production
  admin.

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

## What this document does not do

This document does not approve a launch, does not set a price, a
VAT rate, a refund term, an AI provider, a budget cap, a domain,
or a hosting choice, and does not publish any legal wording. Every
one of those decisions still belongs to the owner, and must be
recorded with evidence before deployment starts.
