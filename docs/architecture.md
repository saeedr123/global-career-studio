# Architecture - Phase 1
Date: 4 November 2026
Status: Design only. No code is claimed as built from this document.
Environment checked 4 November 2026: Node 24.22.1, npm 10.9.4, Python 3.12.3, no local Postgres. Use hosted Postgres, not a local Postgres assumption.

## Product and deployment shape

One integrated application, Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, Stripe, hosted Postgres, object storage for photos and exports, and background jobs for export and AI work that takes time.

Entry points, one application:
- Direct on the tools site domain, to be decided in open decisions.
- Linked from nvconsult.eu, tools section, menu, and relevant service pages, to the same application and same account.
- No second copy of the builder. No separate NVConsult builder and Studio builder to keep in sync.

Auth, initial decision:
- Initially one shared login system for NVConsult and Global Career Studio.
- Auth is a separate module with a clear interface, so a later split to separate logins, or to single sign on, is a configuration and migration task, not a rewrite of the builder, templates, or billing.
- Roles: user, admin. Admin access to user documents is logged, limited, and only for support with a recorded reason.

## Module boundaries, mandatory separation

1. Candidate profile: Personal details, education, work history, skills, projects, certifications, languages. One profile per account, reused across documents. No document stores a copy of the profile that drifts from the master profile without a version note.
2. Document content: A document is a profile snapshot plus document specific edits, template choice, section order, and custom sections. Editing a document does not silently change the master profile unless the user confirms a save back to profile.
3. Template definitions: Layout structure, section order, typography, colours, spacing, paper size defaults, and photo rules, stored as data, not as code per template. A new template is a new definition plus styles, not a copy of the builder.
4. Rendering: One rendering abstraction that feeds PDF, DOCX, and PNG, so a document does not look different in each format without a documented reason. Rendering must produce selectable PDF text, editable DOCX headings and paragraphs and lists and tables, and high resolution PNG.
5. AI generation: Provider interface, prompt management, credit counting, and guardrails, separated from the builder. Changing AI provider must not require changing the builder UI.
6. Subscription entitlements: Plan, trial, AI credits, document count, template access, export access, and storage, all read from configuration, never hard coded in components. Entitlement checks happen on the server, not only in the UI.
7. Export processing: Queue, worker, success and failure logging, file storage, and download links. Export failures must preserve the document and show a plain language error.
8. Country and language packs: Country rules, terminology, spelling, paper size, photo guidance, length guidance, section order, and last verified date, plus language strings, fonts, and AI prompt variants, all stored as data with versioning.
9. Admin: Template, prompt, country, occupation, entitlement, trial, user, and feature flag management, with preview, publish, and rollback.

## Frontend

- Next.js App Router, React, TypeScript, Tailwind CSS.
- Design system: Tokens for colours, fonts, spacing, and radii, components for dashboard, editor, preview, and checkout, with no hard coded copy in components where admin copy is required.
- Editor: Live preview, section reorder, custom sections, rich text, font and colour choice, photo crop, margins and spacing, undo and redo, autosave with a visible saved state, and version history with restore.
- Mobile: Editor must be usable on a phone. Drag and drop on desktop, plus move up, move down, and tap to edit on mobile. Preview and export must work on mobile browsers, tested at phone widths.
- Accessibility: Keyboard navigation for section reorder, focus states, colour contrast, and readable text sizes. No text below a readable size to force a fit.

## Backend and data, summary

Full schema design is in docs/database-design.md. Key entities:
- User, Account settings, Session.
- Profile, ProfileEducation, ProfileExperience, ProfileSkill, ProfileProject, ProfileCertification, ProfileLanguage.
- Document, DocumentVersion, DocumentSection, DocumentExport.
- Template, TemplateVersion.
- CountryPack, CountryPackVersion, LanguagePack.
- Occupation, OccupationStarter.
- Plan, Subscription, Trial, AICreditLedger, AIUsageLog.
- Letter, LetterTemplate.
- ATSAnalysis, ATSAnalysisResult.
- ShareLink, HumanReviewRequest.
- AdminAuditLog, ExportLog, SystemLog.

Rules:
- Users can only access their own documents, unless they explicitly share a read only link.
- AI usage, export, subscription, trial, and admin changes are logged without logging CV text, job description text, or secrets.
- Deleting an account deletes documents, photos, exports, and AI logs for that account, with backups expiring on a stated schedule.
- Uploaded job descriptions are user data, never training data, and are deletable with the document.
- No training on user CVs, letters, or job descriptions, unless the user gives separate explicit consent for a specific purpose, stated in the privacy policy.

## AI provider interface

- Interface methods: generate summary, improve bullets, tailor to job description, generate letter draft, check ATS keywords. Each method takes profile data, job description if given, language, country pack, and occupation, and returns suggestions, not final facts.
- Guardrails in code, not only in prompts: No invented employer, date, qualification, or certification. If a field is missing, return a missing info prompt, not invented text. Every suggestion is editable, accept or reject.
- Credit model: AI credits are counted per generation, shown in the dashboard, with monthly limits from configuration. A failed generation must not consume a credit without a log and a retry path.
- Provider choice is an open decision. Do not hard code a provider name in the builder. Use an environment variable for provider, model, and budget cap, with a fallback provider option in configuration.

## Export engine, design

- PDF: Server side rendering, correct A4 and US Letter dimensions, selectable text, embedded fonts where permitted, accurate pagination.
- DOCX: Real headings, paragraphs, lists, and tables, editable in Word, not a PDF image inside Word. Test by opening, editing, saving, and re exporting in the test plan.
- PNG: High resolution, page accurate, premium resolution rule from configuration.
- JPEG: Lower priority, after PDF, DOCX, and PNG are stable.
- Overflow: Warn before export, show where overflow happens, offer trim, spacing within safe limits, or move to two pages. Never clip, overlap, or shrink below readable size to force a fit.
- Tests per template: Long content, multilingual text for version 1 languages, photo and no photo, single and two page, A4 and US Letter, DOCX editability, visual regression with a reference render and human review of diffs.

## Payments

- Stripe, monthly and annual, with trial configuration from admin.
- Trial default in PROMPT.md v2: 7 days, no card, one per account, downgrade keeps view and download, premium editing locks. All values configurable.
- Cancel in account, in a small number of clicks, with immediate confirmation and end of period access.
- VAT and invoices for EU customers, with exact VAT treatment confirmed with Ali's accountant before launch. Do not invent tax rates in code as advice.
- Refund policy published before launch, handled through Stripe and admin, with a log.

## Hosting, to decide in open decisions

Options to evaluate in Phase 2, not decided in Phase 1:
- Next.js hosting: Vercel, or a VPS with Node, with a clear backup and rollback plan.
- Postgres: Hosted Postgres service, with daily backups and point in time recovery if available.
- Object storage: For photos and exports, with signed access, not public by default.
- Monitoring: Uptime, export success rate, AI error rate, and payment webhook failures, with alerts, without logging CV content.
- Do not choose a host in Phase 1 on price alone. Choose on backup, rollback, GDPR data location, and support for the Studio launch market.

## Security checklist, Phase 1 design

- Secure authentication, role based permissions, file upload validation by type and size, rate limiting on auth, AI, and export, secure API access, audit logs, secure environment variables, GDPR conscious data management.
- Secrets never in code, commits, docs, or logs.
- Signed URLs for photos and exports, with expiry.
- Rate limits with plain language user messages when a limit is hit.

End of architecture, Phase 1.
