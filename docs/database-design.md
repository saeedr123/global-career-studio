# Database Design - Phase 1, updated Phase 2 increment 2
Date: 4 November 2026, updated 4 November 2026 for split ready design
Status: Schema implemented in prisma/schema.prisma in Phase 2 increments 1 and 2. No migration is claimed as run until Prisma validation and a test migration pass, see PROJECT_STATUS.md for the current attempt result.
Stack: PostgreSQL, Prisma ORM. All ids are UUIDs unless stated. All timestamps are UTC. All user content fields are nullable where the user may not have that data yet, to avoid forcing invented values.

## Edition tag, split ready design, Phase 2 increment 2

Combined now, split later if needed. Every User row and every Document row carries an edition value, with allowed values nvconsult and commercial, and a default of commercial for rows created without an explicit entry edition. The edition value records the entry edition, it is not a hard restriction on which edition a user may use later. A user who uses both editions will have documents in both partitions, and that case must be resolved explicitly at split time, not silently assigned to one side. Billing products are configured per edition, even on the same Stripe account, so they can be moved apart later. A later split partitions users and documents by this edition value, after a separate decision and a test migration.

## Core tables

User
- id, email unique, name, passwordHash, role (user, admin), edition (nvconsult or commercial, default commercial, entry edition at signup), createdAt, updatedAt, deletedAt (soft delete, with a hard delete job on request)
- Indexes: email, edition

Profile
- id, userId unique, headline, summary, phone, city, country, website, linkedinUrl, photoStorageKey, photoCrop, createdAt, updatedAt
- One profile per user in version 1. Later, multiple profiles are a migration, not a silent change.

ProfileEducation
- id, profileId, institution, qualification, field, startDate, endDate, isCurrent, grade, description, sortOrder

ProfileExperience
- id, profileId, employer, jobTitle, location, startDate, endDate, isCurrent, descriptionBullets (JSON array of strings, user edited), sortOrder

ProfileSkill, ProfileProject, ProfileCertification, ProfileLanguage
- Skill: id, profileId, name, level (free text plus a controlled level in a later version), sortOrder
- Project: id, profileId, title, description, link, sortOrder
- Certification: id, profileId, name, issuer, date, sortOrder
- Language: id, profileId, language, proficiency (CEFR style in Europe packs, free text elsewhere), sortOrder

## Documents

Document
- id, userId, profileId, title, documentType (cv, coverLetter, motivationLetter, otherLetter, linkedinAbout, bio, personalStatement), templateId, countryPackId, language, paperSize (A4, US Letter), pageCountTarget (1, 2), status (draft, ready, archived), edition (nvconsult or commercial, default commercial, entry edition for this document), createdAt, updatedAt
- A document stores a snapshot reference to the profile version at creation, plus document specific edits in DocumentSection, so editing a document does not silently change the master profile.

DocumentSection
- id, documentId, sectionKey, title, contentJson, sortOrder, isVisible
- Custom sections use a custom sectionKey and a user title, stored the same way as standard sections.

DocumentVersion
- id, documentId, label, snapshotJson, createdAt, createdBy (user)
- Restore creates a new version from the snapshot, it does not overwrite history.

DocumentExport
- id, documentId, format (pdf, docx, png, jpeg), storageKey, status (queued, processing, ready, failed), errorMessage (plain language, no system details), createdAt
- Export files are stored in object storage, referenced by storageKey, never as blobs in the database.

ShareLink
- id, documentId, tokenHash, isActive, expiresAt, createdAt
- Read only view only. No edit through a share link. Token is hashed, the plain token is shown once at creation.

HumanReviewRequest
- id, userId, documentId, serviceType (freeReview, paidCreation), status (requested, inProgress, delivered, cancelled), notes, turnaroundNote, createdAt
- This is the bridge to NVConsult human review. It must not create a fake human reply. Status changes are recorded, with a real reviewer note on delivery.

## Templates, countries, languages

Template
- id, slug unique, name, layoutStructure, typography, colourPaletteJson, defaultPaperSize, photoAllowed, isActive, createdAt, updatedAt
- Distinctness is a design review, not a database field alone. A template is distinct only if layoutStructure, section order, and typography differ, not only colour.

TemplateVersion
- id, templateId, versionNumber, definitionJson, status (draft, published, retired), publishedAt, createdBy

CountryPack
- id, slug unique, name, region, terminologyJson, spelling, paperSizeDefault, photoGuidance, lengthGuidance, sectionOrderJson, sourceNotes, lastVerifiedAt, isActive
- LastVerifiedAt is mandatory. An out of date pack is flagged for review in admin, not silently shown as current.

CountryPackVersion
- id, countryPackId, versionNumber, definitionJson, status, publishedAt

LanguagePack
- id, code unique (en, de, fr, es in version 1), name, interfaceStringsJson, documentStringsJson, fontFamily, isRTL, isActive
- Version 1 languages: English, German, French, Spanish. Chinese is not in version 1, see docs/chinese-demand-gate.md.

Occupation
- id, slug unique, name, starterSummary, starterSkillsJson, starterBulletsJson, isActive
- Starter content is a suggestion, never a fabricated history for a specific user.

## Letters

LetterTemplate
- id, slug unique, letterType, structureJson, toneGuidance, requiredFieldsJson, isActive
- Letter types in version 1 scope: cover letter, motivation letter, reference letter, recommendation letter, employment verification letter, resignation letter, follow up letter, thank you letter, job application email, LinkedIn About, professional bio, personal statement. Each type has its own structure, not a generic letter with a changed title.

## ATS

ATSAnalysis
- id, documentId, jobDescriptionHash (not full job text in the analysis index), scoreHeuristic (integer, heuristic only), createdAt
- Score is heuristic only. Never store a claim that the score is a guaranteed employer ATS result.

ATSAnalysisResult
- id, analysisId, checkKey, result (pass, warning, fail), detail, recommendation
- Checks include: standard headings, parseable text, date consistency, contact completeness, keyword gaps versus job description, formatting risks from tables, graphics, or columns.

## Plans, subscriptions, trial, AI credits

Plan
- id, slug unique (free, premium), name, priceMonthlyCents (nullable for free, and configurable, not hard coded in code), priceAnnualCents, currency, entitlementsJson, isActive
- EntitlementsJson includes: maxDocuments, templateIds allowed, maxAICreditsPerMonth, exportFormats allowed, maxStorageDocuments, letterTypes allowed, atsLevel (basic, advanced). Changing entitlements in admin must not require a code change.

Subscription
- id, userId, planId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt

Trial
- id, userId, planId, startsAt, endsAt, status (active, converted, expired, cancelled), aiCreditAllowance, exportAllowance, createdAt
- Starting default in PROMPT.md v2: 7 days, no card, one per account. Trial eligibility and conversion rules are configuration, not code constants.

AICreditLedger
- id, userId, periodStart, periodEnd, creditsGranted, creditsUsed, createdAt, updatedAt
- Every AI generation creates an AIUsageLog row, with credits consumed, provider, model, and success or failure, without logging the full CV text or job description text in the log.

AIUsageLog
- id, userId, documentId (nullable), operation, creditsConsumed, provider, model, status, createdAt
- Failed generations must not consume a credit without a log and a retry path, to be implemented in Phase 8.

## Admin and logs

AdminAuditLog
- id, adminUserId, action, targetType, targetId, reason, createdAt
- Admin access to a user document must include a reason, and must be logged here.

ExportLog
- id, documentExportId, templateId, format, status, durationMs, createdAt
- No CV content in export logs. Only counts, template, format, status, and timing.

SystemLog
- id, level, message, contextJson (no secrets, no CV text), createdAt

FeatureFlag
- id, key unique, isEnabled, planScope (all, free, premium), createdAt, updatedAt
- Flags can turn a template, language, country pack, or AI feature on or off per plan or globally, without a deployment.

## Indexes and constraints, to implement in Prisma

- Unique: User.email, Template.slug, CountryPack.slug, LanguagePack.code, Occupation.slug, LetterTemplate.slug, Plan.slug, FeatureFlag.key, Document share token hash.
- Foreign keys with cascade rules to be decided per table in Phase 2, with a rule: deleting a user must not orphan a document in a way that leaves a share link active. Share links are deactivated on document deletion and on account deletion.
- Soft delete for User and Document in version 1, with a hard delete job for GDPR requests, to be designed in Phase 4 and Phase 13, not assumed.

End of database design, Phase 1.
