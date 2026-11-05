# Architecture - Phase 1, updated Phase 2 increment 2
Date: 4 November 2026, updated 4 November 2026 for split ready design
Status: Design only, except for the schema, scaffold, template engine, and dashboard shell already built in Phase 2 increments 1 and 2. No feature beyond those increments is claimed as built from this document.
Environment checked 4 November 2026: Node 24.22.1, npm 10.9.4, Python 3.12.3, no local Postgres. Use hosted Postgres, not a local Postgres assumption. Hosted Postgres chosen in Phase 2 increment 13: Neon, free plan, region AWS EU Central Frankfurt (eu-central-1), see docs/database-design.md for the decision, the limits, and the runner up. No live Neon database is connected in increment 13, because no DATABASE_URL has been shared and no repo secret has been added yet.

## Product and deployment shape

One combined application now, split later if needed, Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, Stripe, hosted Postgres, object storage for photos and exports, and background jobs for export and AI work that takes time.

Entry points, one application now:
- Direct on the tools site, domain on hold as of 4 November 2026, so placeholder domain configuration only, no domain check, no purchase.
- Linked from nvconsult.eu, tools section, menu, and relevant service pages, to the same application and same account.
- No second copy of the builder in version 1. No separate NVConsult builder and Studio builder to keep in sync.

## Split ready design, decided 4 November 2026

Combined now, split later if needed, supersedes a brief two separate versions choice made the same day. The rules below are mandatory, so a later split is a deployment and data partition task, not a rebuild:
- Shared template and export engine: templates, rendering, PDF export, and DOCX export live in one package, used by both editions.
- Separate skins and copy per edition: branding, header, landing copy, buttons, and help links are edition configuration, never hard coded into the engine.
- Modular auth service: auth is a separate module with a clear interface, so a later split to separate logins, or to single sign on, is a configuration and migration task, not a rewrite of the builder, templates, or billing.
- Edition tag on every user and document: each User row and each Document row carries an edition value (nvconsult or commercial) recording the entry edition. A user who uses both editions will have documents in both partitions, and that case must be resolved explicitly at split time, not silently assigned to one side.
- Separate billing products per edition, even on the same Stripe account: plan and trial products are configured per edition, so they can be moved apart without changing prices for the other edition.
- Separate entry points: nvconsult.eu is the NVConsult journey, the tools site is the commercial journey, even though both open the same application now.
- Free tier presentation: same free tier for everyone, in both editions. NVConsult adds human help: free consultation and human CV review as the extra. There is no special NVConsult client Studio benefit at launch, and no second public price list.
- What a split would require, in order: copy the app shell into two deployments, keep the shared engine, partition users and documents by the edition tag, move each billing product to its own setup, give each edition its own login if required, retest exports and billing in both deployments, and tell users which door they are now on, with redirects from old links. A split must not be started on the basis of this paragraph alone; it needs a separate decision, with a migration plan and a test database run first.

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
- Design system: Tokens for colours, fonts, spacing, and radii, components for dashboard, editor, preview, and checkout, with no hard coded copy in components where admin copy is required. Phase 2 increment 2 implements the token set and a dashboard shell only, with an edition aware header selected by configuration. No real auth, billing, or document editing is claimed from the shell.
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
- Postgres: Hosted Postgres service, with daily backups and point in time recovery if available. Chosen in Phase 2 increment 13: Neon, free plan, region AWS EU Central Frankfurt (eu-central-1). Limits to recheck on Neon's own pricing page before creating: free storage reported as 0.5 GB in some sources and 1 GB in others, about 100 CU-hours per project per month, scale to zero after 5 minutes idle with a short cold start on the first query, and free projects inactive 90 days or more subject to deletion per one source. Supabase is the runner up, not chosen, because the Studio does not need its bundled Auth, storage, or realtime, and its 7 day pause is the worse failure mode for a quiet beta. No live Neon database is connected in increment 13.
- Object storage: For photos and exports, with signed access, not public by default.
- Monitoring: Uptime, export success rate, AI error rate, and payment webhook failures, with alerts, without logging CV content.
- Do not choose a host in Phase 1 on price alone. Choose on backup, rollback, GDPR data location, and support for the Studio launch market.

## Security checklist, Phase 1 design

- Secure authentication, role based permissions, file upload validation by type and size, rate limiting on auth, AI, and export, secure API access, audit logs, secure environment variables, GDPR conscious data management.
- Secrets never in code, commits, docs, or logs.
- Signed URLs for photos and exports, with expiry.
- Rate limits with plain language user messages when a limit is hit.

End of architecture, Phase 1.
