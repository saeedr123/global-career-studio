# Prisma (Phase 2 increment 13)

This folder holds the Prisma schema, the initial migration, and the
migration lock file. The chosen hosted Postgres is Neon, free plan,
region AWS EU Central Frankfurt (eu-central-1), recorded in
docs/database-design.md and docs/deployment-preparation.md, with
Supabase as the runner up. No live Neon database is connected in
this increment, because no DATABASE_URL has been shared and no repo
secret has been added yet. The owner adds the secret himself on
GitHub at Settings, Secrets and variables, Actions, New repository
secret, name DATABASE_URL, value the Neon pooled connection string,
and never pastes it in chat or in any file.

## Increment 13 migration, honest status

The initial migration at migrations/20261105000000_init/migration.sql
was authored from prisma/schema.prisma in this increment, because
the Prisma engine download fails in this workspace and no local
Prisma run can generate it. It covers all 32 models and all 15
enums from the schema, checked locally with a script that matched
every model, enum, enum value, and scalar column against the
migration file: 32 CREATE TABLE statements, 15 CREATE TYPE
statements, 31 foreign keys, balanced parentheses. That script
check is NOT a Prisma run, and the migration is NOT claimed as
proved until the CI workflow passes. The workflow at
.github/workflows/prisma-migration.yml runs prisma migrate diff
from empty to the schema as a review artifact, then runs prisma
migrate deploy with the committed migration against an ephemeral
Postgres 15 service container, then runs prisma migrate status.
That workflow is pushed, and its run is pending on GitHub, not
claimed as passed, because this environment cannot check a run
status. Local Prisma generate in increment 13 failed again with
the same ECONNRESET engine download error as before, so no client
was generated locally. The @prisma/client package 6.14.0 is now a
dependency in apps/web/package.json and is installed in the local
node_modules, but the generated client is absent, because generate
cannot run here. The app loader in apps/web/lib/prisma.ts returns
null in that state and the app keeps using local browser storage,
clearly labelled. No migration was run against any real database,
and the provider was NOT changed to SQLite.

## Increment 13 data layer

The Prisma client setup is in apps/web/lib/prisma.ts (singleton,
DATABASE_URL from the environment only, never a value in code).
The server side data layer is in apps/web/lib/database-core.mjs
(User, Profile and profile detail rows, Document, DocumentVersion,
admin audit, ownership checks, no password hash ever returned).
The status route is at apps/web/app/api/database-status/route.ts.
Database tests at apps/web/scripts/test-database.mjs passed 25 of
25 with a mocked client only, never a real database.

# Prisma (Phase 2 increment 12)

This folder holds the Prisma schema only. No migration has been run yet,
and no database is connected. In increment 12, a GitHub Actions
workflow was added at .github/workflows/prisma-validate.yml to run
prisma validate, prisma generate, and prisma db push against an
ephemeral Postgres service container on GitHub. WORKFLOW PUSHED
AFTER TOKEN UPDATE: the first upload in increment 12 was blocked
with status 403, Resource not accessible by personal access token,
because the token did not yet have Workflows access. Ali updated
the token to include Workflows Read and write on 2026-11-05, and
the retry returned status 201, sha
8959c8154e9fa18aa482f3742ee8eba48d64aad7. CI RUN PASSED ON
2026-11-05: Ali checked the GitHub Actions page and reported all
green, 4 green runs on main, Prisma validate #1 commit bc6b40a
59s, #2 commit b232d1a 58s, #3 commit 44e75c2 50s, #4 commit
25d9358 1m 2s, all pushed by saeedr123. A green run means every
workflow step passed, validate, generate, and db push against
the ephemeral Postgres 15 service container, so the schema is
now officially validated and the db push test passed. Local
validation in this environment still has NOT passed, for the same
ECONNRESET reason, but the GitHub Actions run is the official
proof. No migration has been run against any real database yet.
The provider was NOT changed to SQLite, checksums were
NOT ignored, and no migration was run against any real database.
Do NOT treat the schema as officially validated until a CI run
result is read on GitHub.

# Prisma (Phase 2 increment 11)

This folder holds the Prisma schema only. No migration has been run yet,
and no database is connected. All accounts, drafts, job versions,
letters, and admin state remain local browser data only, clearly
labelled, until Prisma validation and a test migration pass elsewhere.

## Increment 11 validation retry, honest result

Prisma validation did NOT pass again, and no migration was run.
Retry made once in this increment, in a clean temporary folder with
the current schema copied from this folder, Node v24.22.1,
npm 10.9.4:
- Command: npm install --no-bin-links --ignore-scripts prisma@6.14.0,
  then node node_modules/prisma/build/index.js validate --schema schema.prisma
- Install result: succeeded, 35 packages.
- Validate result: exit 1, exact error: Error aborted, at
  TLSSocket.socketCloseListener, code ECONNRESET, attemptNumber 1,
  retriesLeft 2. This is the same engine download failure as
  increments 1, 2, and 3. No provider was changed to SQLite to
  force a green check, and no migration was run, because validation
  did not pass.
Do NOT treat the schema as officially validated until prisma validate
and a test migration pass on a machine where the engine download works.

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
