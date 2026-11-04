# Prisma (Phase 2 increment 3)

This folder holds the Prisma schema only. No migration has been run yet,
and no database is connected in this increment. The builder in increment
3 therefore uses local browser drafts only, clearly labelled as a
temporary stand in until Prisma validation and a real database pass.

## Increment 3 validation retry, honest result

Prisma validation did NOT pass again, and no migration was run.
Attempt made in a clean temporary folder with the current schema copied
from this folder, Node v24.22.1, npm 10.9.4:
- Command: npm install --no-bin-links --ignore-scripts prisma@6.14.0,
  then node node_modules/prisma/build/index.js validate --schema schema.prisma
- Install result: succeeded, 35 packages.
- Validate result: exit 1, exact error: Error aborted, at
  TLSSocket.socketCloseListener, code ECONNRESET, attemptNumber 1,
  retriesLeft 2. This is the same engine download failure as increments
  1 and 2. No provider was changed to SQLite to force a green check.
Do NOT treat the schema as officially validated until prisma validate
and a test migration pass on a machine where the engine download works.

## Increment 2 validation attempt, honest result

Prisma validation did NOT pass in this environment, and no migration was
run. Attempts made 4 November 2026, in a clean temporary folder with the
schema copied from this folder:
- prisma@6.14.0, normal install: failed at @prisma/engines postinstall
  with ECONNRESET, Error aborted, at TLSSocket.socketCloseListener.
- prisma@6.14.0, install with --ignore-scripts, then validate: install
  succeeded, validate still failed with the same ECONNRESET error when
  it tried to download an engine.
- prisma@5.22.0, install with --ignore-scripts, then validate: install
  succeeded, validate still failed with the same ECONNRESET error.
No provider was changed to SQLite to force a green check. The schema was
instead checked structurally in increment 2: 32 models, 15 enums
(including the new Edition enum), balanced braces (49 open, 49 close),
edition fields present on User and Document. Do NOT treat the schema as
officially validated until prisma validate and a test migration pass on
a machine where the engine download works. That remains the first task
for the next increment.

## Schema

`schema.prisma` implements `docs/database-design.md`, covering User, Profile
and profile detail tables, Document, DocumentSection, DocumentVersion,
DocumentExport, Template, TemplateVersion, CountryPack, CountryPackVersion,
LanguagePack, Occupation, LetterTemplate, ATSAnalysis, ATSAnalysisResult,
Plan, Subscription, Trial, AICreditLedger, AIUsageLog, ShareLink,
HumanReviewRequest, AdminAuditLog, ExportLog, SystemLog, and FeatureFlag.

All ids are UUIDs. All timestamps are UTC.

## Environment

Set `DATABASE_URL` from the root `.env.example` placeholders. Use a hosted
Postgres database for any real test run. Do not assume a local Postgres
server exists, because the Phase 1 environment check found none installed.

## Later steps (not in increment 1)

Install Prisma, generate the client, and run migrations against a test
database only. Do not run migrations against production until hosting,
backup, and legal decisions are recorded in PROJECT_STATUS.md.
