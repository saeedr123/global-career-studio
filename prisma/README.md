# Prisma (Phase 2 increment 1)

This folder holds the Prisma schema only. No migration has been run yet,
and no database is connected in this increment.

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
