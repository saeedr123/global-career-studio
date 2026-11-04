# PROJECT: GLOBAL CAREER STUDIO - REWRITTEN PROMPT v2

## AI-Powered International CV, Resume and Career Document SaaS

Status: Rewritten prompt, 4 November 2026. Approved by Ali for Phase 1 planning.
Status update, Phase 2 increment 2, 4 November 2026: Combined now, split later, is now the standing edition decision. It supersedes a brief two separate versions choice made the same day, and it restores the original v2 principle of initially same login, modular so it can split later. Section 2.6 records the split ready rules. No other scope in this prompt changes in this update.
Status note: This prompt is the controlling brief. It is not code, and no feature in it is claimed as built until it is implemented and tested in the repository.

This version incorporates Ali's original prompt, Muse's review suggestions from 4 November 2026, and Ali's decisions from the same day. Where this version changes the original, this version wins.

## What changed from v1, in plain terms

1. Delivery: The project lives in a GitHub repository as the single source of truth. Work is delivered by commits, branches, tags, and releases in that repository, not by manual file drops.
2. One integrated application: Build ONE integrated application, not two separate applications. The same application serves visitors from nvconsult.eu and visitors on the standalone tools site.
3. Templates: Version 1 ships 10 distinct templates, not 20. The remaining 10 from v1 are a Phase 2 backlog, not cut silently.
4. Countries for testing: Version 1 tests with a small set only: US, Canada, UK, Germany, Europe (generic European and Europass style pack), Australia, New Zealand, and Global/Universal. The original 30 country list is a Phase 2 backlog.
5. Languages: Version 1 ships English, German, French, and Spanish. Chinese (Simplified) is NOT in version 1. It is a researched Phase 2 candidate, with a demand decision gate defined below.
6. Login: Initially one shared login system for NVConsult and Global Career Studio. The auth design must be modular, so the login can be split later without rewriting the application.
7. Trial: Starting default is a 7 day premium trial, no card required, one trial per account, with a clear downgrade rule. All trial values remain configurable in admin, so Ali can change them without code changes.
8. Editability: Nothing content bearing is hard coded. Copy, templates, pricing, limits, trial rules, country rules, language packs, and AI prompts are editable through admin or configuration, with versioning, preview, and rollback.
9. New value features added from review: CV import, LinkedIn import, job specific versions, human review upsell to NVConsult, country and occupation onboarding wizard, mobile usable builder, share and review link, overflow handling, SEO landing pages, and usage analytics that do not read CV content.
10. Commercial view: Ali confirms Global Career Studio should be commercially good as a standalone SaaS business, not only as a free NVConsult add on. Free must be genuinely useful, premium must be compelling, and the NVConsult link must be a growth channel, not a dependency that blocks standalone sales.

## 0. DELIVERY METHOD: GITHUB REPOSITORY

0.1. The repository is the product record. All source code, database schema, configuration examples, documentation, tests, and PROJECT_STATUS.md live in the repository.
0.2. No manual delivery replaces the repository. A file sent in chat is a preview only. The delivered version is the version committed and tagged in the repository.
0.3. Repository structure, to be created in Phase 0:
- README.md: what the product is, how to run it, how to deploy it, and links to docs.
- PROMPT.md: this file, kept current when scope decisions change.
- PROJECT_STATUS.md: updated at the end of every phase, with what is done, what is tested, what is pending, and what is blocked. Never mark a feature complete unless it works and has been tested.
- docs/: architecture, API documentation, database design, export testing notes, country pack sources, and feature status.
- apps/web/: the Next.js application.
- packages/: template engine, rendering, export, ATS analysis, and AI provider modules, kept separate so they can be tested independently.
- prisma/: schema and migrations.
- tests/: automated tests, including template export tests and visual regression notes.
- .env.example: every required variable, with no real secrets in the repository.
0.4. Branching: main is always releasable. Feature work happens on short lived branches, merged by pull request with tests passing. Releases are tagged, for example v0.1.0 for the Phase 1 planning release, v1.0.0 for the first commercial core.
0.5. Secrets: No passwords, API keys, Stripe secrets, or tokens in code, commits, or docs. Use environment variables and a secure secret store. Rotate any secret that is ever committed by mistake.
0.6. Remote setup is an open step: the local repository is created in Phase 0, and the GitHub remote is connected once Ali confirms the repository name, visibility (private recommended for pre launch), and owner account. Until the remote is connected, work is still committed locally with the same discipline, and no manual file drop is treated as the release.

## 1. PRODUCT OBJECTIVE

Build a modern global career document platform that serves students, graduates, job seekers, experienced professionals, executives, career changers, freelancers, international applicants, and academic professionals.

Support global employment markets and different resume conventions.

Do not build a generic AI writing wrapper. Build a professional document creation and career intelligence system, where the document, the template, the country rules, and the job match are separate, testable parts.

The product must be suitable for real customers worldwide, capable of producing professional, editable, high quality career documents, and capable of operating as a standalone SaaS business.

## 2. BRAND, PLACEMENT, AND LOGIN

2.1. Brand: Global Career Studio, as a standalone commercial brand.
2.2. Placement: ONE combined application now, split later if needed. It is reached from nvconsult.eu (tools section, menu link, and relevant service pages) and directly on its own tools site. Both entry points use the same application, same account, and same documents now. There is no second copy of the builder to maintain in version 1.
2.3. NVConsult link, commercial logic: The NVConsult audience (students and workers from Asia, Africa, and beyond, moving to Europe and beyond) is a launch audience and a trust channel, not the only market. The product must also make sense to a visitor who has never heard of NVConsult.
2.4. Login, initial decision: Initially the same login system is used across NVConsult and Global Career Studio. Implement auth as a modular service with a clear boundary, so a later split (separate NVConsult login and Studio login, or single sign on) is a configuration and migration task, not a rewrite.
2.5. Free tier presentation, decided 4 November 2026: Same free tier for everyone, in both editions. NVConsult adds human help: free consultation and human CV review as the extra. There is no special NVConsult client Studio benefit at launch, and no second public price list. A client benefit through an admin invite code may be added later, not as a second public price list.
2.6. Split ready design, decided 4 November 2026: Combined now, split later if needed. The following rules are mandatory, so a later split is a deployment and data partition task, not a rebuild:
- Shared template and export engine: templates, rendering, PDF export, and DOCX export live in one package, used by both editions.
- Separate skins and copy per edition: branding, header, landing copy, buttons, and help links are edition configuration, never hard coded into the engine.
- Modular auth service: auth is a separate module with a clear interface, so each edition can later have its own login without rewriting the builder, templates, or billing.
- Edition tag on every user and document: each User row and each Document row carries an edition value (nvconsult or commercial) recording the entry edition. A user who uses both editions will have documents in both partitions, and that case must be resolved explicitly at split time, not silently assigned to one side.
- Separate billing products per edition, even on the same Stripe account: plan and trial products are configured per edition, so they can be moved apart without changing prices for the other edition.
- Separate entry points: nvconsult.eu is the NVConsult journey, the tools site is the commercial journey, even though both open the same application now. The tools site domain is on hold as of 4 November 2026, so use placeholder domain configuration only, do not check domain availability, and do not purchase anything.
- What a split would require, in order: copy the app shell into two deployments, keep the shared engine, partition users and documents by the edition tag, move each billing product to its own setup, give each edition its own login if required, retest exports and billing in both deployments, and tell users which door they are now on, with redirects from old links. A split must not be started on the basis of this paragraph alone; it needs a separate decision from Ali, with a migration plan and a test database run first.
2.5. Account data: One candidate profile per account, reused across documents. A user must not retype personal details, education, and work history for every new CV or letter.

## 3. COMPETITOR RESEARCH (PHASE 1, BEFORE BUILDING FEATURES)

Before implementation, research leading platforms, including Resume.io, Zety, Enhancv, Kickresume, Novoresume, FlowCV, Canva, Rezi, Teal, VisualCV, Resume Genius, and Europass, plus other relevant competitors found during research.

Investigate their actual features, user journeys, template quality, export capabilities, pricing, customer complaints, and missing functionality. Identify opportunities for a superior user experience.

Document findings in docs/competitor-research.md, with sources, dates, and links. Do not invent research findings. Where a claim cannot be verified from a primary source, mark it as unverified and do not use it to set a feature or price.

Research must also answer, with evidence, not opinion:
- What free limits actually convert, and where users complain about paywalls, watermarks, or locked downloads.
- Which templates are genuinely different, and which are colour variants.
- Where DOCX export breaks, and where PDF text is not selectable.
- What ATS claims competitors make, and what complaints exist about those claims.
- What import, job tailoring, and version features exist, and what is missing.

## 4. SCOPE CONTROL: VERSION 1, PHASE 2, AND NON GOALS

Version 1 is a functional, polished core product, not every idea in this prompt at once. Advanced features come after the core is tested and usable.

Version 1 must include:
- Auth, profile, dashboard, and document storage.
- Template engine with 10 distinct templates.
- Live editor with autosave, version history, and mobile usable editing.
- PDF and genuinely editable DOCX export, plus PNG export for premium.
- AI career writer with guardrails, job description tailoring, and credit limits.
- Career letter studio for the core letter types.
- ATS intelligence as heuristic analysis, with clear disclaimers.
- Country packs for the version 1 set only.
- Languages for version 1 only.
- Free and premium gating, 7 day trial default, Stripe monthly and annual billing.
- Admin panel for templates, prompts, countries, occupations, entitlements, trial, and users.

Phase 2 backlog, explicitly not version 1, to be built after version 1 is validated:
- Templates 11 to 20 from v1: Creative, Academic, Canadian, Australian, Technical, Financial, Healthcare, Engineering, Timeline, and Premium Classic. Note: Canada and Australia country packs are still in version 1, using version 1 templates with Canadian and Australian conventions. Template design and country rules are separate.
- Countries beyond the version 1 set, up to the original 30, in batches, each with verified sources and a last verified date.
- Languages beyond version 1, gated by demand and quality checks, including Chinese (Simplified) if it passes its gate, plus Urdu and other languages from v1 as later candidates.
- Full interview preparation, job tracker with full pipeline, salary tools, and portfolio sites, unless Phase 1 research proves one of them is a launch blocker.

Non goals for version 1: a job board, employer hiring tools, recruitment agency features, and any feature that requires inventing employer data, salary data, or visa rules. Visa advice stays on NVConsult, with a link, not inside the CV builder.

## 5. CV AND RESUME BUILDER

Version 1 ships at least 10 distinct professional templates. The version 1 set is:
1. ATS Minimal
2. Modern Professional
3. Executive
4. Corporate
5. Elegant
6. European (including Europass style structure)
7. US Resume
8. UK CV
9. Sidebar
10. Two-column

Distinctness test, mandatory: A template counts as distinct only if it differs in layout structure, section order, and typography system, not only in colour. Colour variants of the same layout do not count toward the 10. Each template must be documented with its layout, intended market, and best use case.

Support in version 1:
- Single page and two page layouts, with clear overflow handling (see section 11).
- Photo and no photo variations, where appropriate for the target market.
- A4 and US Letter paper sizes, chosen by country pack default, changeable by the user.
- Multiple colours, different fonts, adjustable margins, and custom sections.
- Section reordering, custom section titles, and show or hide for each section.
- Sample content for first time users, clearly marked as sample, replaceable in one action, and never exported as if it were the user's real history.

## 6. IMPORT AND ONBOARDING (ADDED FROM REVIEW)

6.1. Import existing CV: Upload PDF or DOCX and parse it into editable profile fields. Show the parsed result for user correction before it becomes a document. Never silently keep a parsing error as fact.
6.2. LinkedIn import: Where the platform and user permission allow, import profile data into the same editable profile. If a direct import is not available at launch, provide a structured paste and guided import flow, and mark the limitation honestly in docs.
6.3. Onboarding wizard: Ask target country or market, occupation or target role, and experience level first. Then suggest templates, paper size, photo guidance, and section order for that market. The wizard is a suggestion, not a lock. The user can change every choice.
6.4. Cold start: A new user must be able to produce a usable first draft in one session, with sample data, guided prompts, and a preview that updates live.

## 7. AI CAREER WRITER

Develop occupation specific AI generation. Generate and improve professional summaries, work experience bullets, achievements, responsibilities, skills, projects, education descriptions, certifications, and professional biographies.

Support job specific tailoring using an uploaded or pasted job description. Tailoring must highlight relevant experience and skills from the user's own profile, and must not add skills, jobs, or qualifications the user does not have.

Guardrails, mandatory:
- Never fabricate qualifications, employment history, achievements, dates, or certifications.
- Ask the user for missing information, with a clear missing info prompt, instead of filling a gap with invented text.
- Every AI suggestion is editable, accept or reject, and shown as a suggestion, not as a final fact.
- AI prompts are managed in admin, versioned, and changeable without code changes.
- Uploaded job descriptions are treated as user data, not training data, and are deletable with the document.
- AI output quality is checked per language in version 1. A language is not launched for AI generation until sample outputs have been reviewed for grammar, tone, and formatting.

## 8. CAREER DOCUMENT STUDIO

Generate, with appropriate structure for each category:
Cover Letters, Motivation Letters, Reference Letters, Recommendation Letters, Employment Verification Letters, Resignation Letters, Follow-up Letters, Thank You Letters, Job Application Emails, LinkedIn About Sections, Professional Bios, and Personal Statements.

Support matching designs where appropriate, so a cover letter can match the CV template, colour, and font chosen by the user.

Each letter type must have its own structure, tone guidance, and required fields, not a single generic letter with a changed title. For reference and recommendation letters, the system must make clear who the author is, and must not generate a false signature, false employer letterhead, or false referee claim.

## 9. ATS INTELLIGENCE

Implement resume structure analysis, keyword analysis, job description matching, missing skill identification, formatting warnings, readability assessment, section completeness, and improvement recommendations.

Present scores as heuristic guidance only. Do not claim universal ATS compatibility, and do not present heuristic scores as guaranteed employer ATS results. Every score must show what it measured, what it did not measure, and the top three concrete fixes, in plain language.

ATS checks must include, at minimum: standard section headings, parseable text (not images of text), date format consistency, contact completeness, keyword gaps versus the pasted job description, and formatting risks such as tables, graphics, or columns that can break parsing in strict ATS templates.

## 10. INTERNATIONAL CAREER INTELLIGENCE, VERSION 1 SET

Initially support and test with:
US, Canada, UK, Germany, Europe (generic European and Europass style), Australia, New Zealand, and Global/Universal.

For each pack, include country specific terminology, formatting, spelling, paper size, photo guidance, CV length guidance, section order, and document recommendations.

Distinguish local conventions from legal requirements in every pack. A convention (for example, photo use in Germany versus the US) must never be presented as a legal requirement. Where a rule is legal (for example, right to work documentation), cite the source type and add a disclaimer to check the current official source.

Each pack must carry a last verified date and source notes in admin, and a visible last verified note where the user sees market guidance. If a pack is out of date, mark it as needing review, do not silently keep showing it as current.

Expansion rule: Add a new country only after its pack is researched, sourced, and tested with a sample CV in that market. Do not add countries by copying another pack and changing the name.

## 11. MULTILINGUAL GENERATION, VERSION 1 AND CHINESE GATE

Version 1 languages: English, German, French, and Spanish.

Support Unicode, appropriate fonts, and correct layout for each version 1 language. Interface text and document content are separate: a user can write a CV in German while using the interface in English, and vice versa, where the system supports it.

Chinese (Simplified) demand check, Phase 1 research task, not a version 1 build:
- Evidence found in initial checks: major competitors already support Chinese, including Resume.io which recently added Chinese and Hindi and described China as one of the largest professional markets, and several builders list Chinese among 10 to 21 supported languages. Bilingual Chinese to English tools also exist for international students. This shows competitor supply, not proof of demand from Global Career Studio's own audience.
- Decision gate for Chinese: Build Chinese only if Phase 1 research and early validation meet at least two of these: (a) measurable search or waitlist interest from the target audience, (b) NVConsult inquiries or audience data showing Chinese speaking users or China market applicants, (c) a clear use case that version 1 languages do not serve, such as Chinese speaking applicants to English speaking markets needing bilingual output.
- Cost note for the gate: Chinese text uses full width characters, which changes alignment, spacing, and template layout. Fonts must be embedded correctly, and layout must be tested separately. Do not add Chinese by enabling a language flag without layout and font testing.
- Architecture rule: Build the system Unicode ready from version 1, so adding a language later is a language pack, font, and prompt task, not a rebuild. This includes RTL readiness in the layout system, even though no RTL language is in version 1.

Other languages from v1 (including Dutch, Portuguese, Czech, Slovak, Polish, Romanian, Hungarian, Turkish, Arabic, Urdu, Hindi, Russian, Japanese, and Korean) remain in the Phase 2 backlog, gated by demand, font availability, and quality review.

## 12. LIVE DOCUMENT EDITOR

Implement live preview, drag and drop on desktop with a mobile equivalent (move up, move down, tap to edit), section reordering, custom sections, rich text editing, font selection, colour customization, photo upload and cropping, margins and spacing, undo and redo, autosave, and version history.

Mobile requirement: The builder must be usable on a phone, not only viewable. Editing, preview, and export must work on mobile browsers, with tap targets and layouts tested at phone widths. This matters because NVConsult traffic is heavily mobile.

Photo handling: Validate file type and size, allow cropping, store the original and the cropped version separately where feasible, and allow removal in one action. Photo guidance must follow the country pack (for example, no photo guidance for US, UK, Canada, and Australia in most cases).

Autosave and versions: Autosave on change, with a visible saved state. Version history must allow restore to an earlier version, and must show date and a user editable version label. Deleting a version must not delete the current document by accident.

Overflow handling, mandatory: When content exceeds the chosen page count, the system must warn before export, show where the overflow happens, and offer concrete options (trim a section, reduce spacing within safe limits, or move to two pages). It must never clip text, overlap content, or silently shrink text below a readable size to force a fit.

## 13. EXPORT ENGINE

Support PDF, editable Microsoft Word DOCX, PNG, and JPEG (JPEG as a lower priority export, after PDF, DOCX, and PNG are stable).

Requirements:
- Professional typography, correct page dimensions, accurate pagination, no clipping, no overlapping content, embedded fonts where permitted, selectable PDF text, editable Word content, and high resolution PNG output.
- Do not use a PDF screenshot embedded inside Word as a substitute for a genuinely editable DOCX. DOCX must contain real headings, paragraphs, lists, and tables that the user can edit in Word.
- PDF text must be selectable and searchable, not an image.
- PNG export must be high resolution and page accurate, with a clear premium versus free resolution rule in admin.

Automated tests, mandatory for every template:
- Long content (two page overflow, long job titles, long bullet lists).
- Multilingual text for every version 1 language.
- Photograph and no photograph variants.
- Single page and two page layouts.
- A4 and US Letter.
- DOCX editability check (open, edit, save, and re export smoke test in the test plan).
- Visual regression: a reference render per template, compared on change, with human review of any visual diff before release.

Export failures must show a plain language error and preserve the user's document. An export failure must never delete or corrupt the saved CV.

## 14. FREE AND PREMIUM SUBSCRIPTION MODEL

Implement two access levels, with all entitlements configurable in admin. Do not hardcode pricing or usage limits throughout the application. Pricing, limits, and trial rules live in configuration and admin, with a change log.

### FREE, starting defaults (configurable, not final pricing)
- Basic CV builder.
- 3 to 5 selected templates from the version 1 set of 10.
- Basic AI writing credits, with a clear monthly credit count shown in the dashboard.
- Basic cover letter functionality.
- Standard PDF exports.
- Limited document storage (starting default: 2 saved documents, configurable).
- Basic customization (colours and fonts within the free template set).
- No watermark trap: Free PDFs are genuinely usable. Limits are on template choice, document count, AI credits, and premium exports, not on making the free CV look deliberately broken.

### PREMIUM, starting defaults (configurable)
- Access to all 10 version 1 templates, and later all templates as they are added.
- Advanced AI generation, higher AI usage limits, and job specific CV tailoring.
- Advanced ATS analysis.
- Full career letter generation.
- DOCX exports and high resolution PNG.
- Advanced customization, photo and no photo variations, and premium document bundles (CV plus matching cover letter plus LinkedIn section as one bundle).
- More document storage, configurable.
- Priority for new templates and country packs as they are released.

### PREMIUM TRIAL, starting defaults (configurable)
- Duration: 7 days. Ali suggested 3 days in discussion, Muse recommended 7 days because CV creation spans gathering documents and a weekend session. The prompt adopts 7 days as the starting default, but duration remains configurable in admin, so Ali can change it to 3 days without code changes.
- Eligibility: One trial per account. Admin can set additional eligibility rules, for example one trial per payment method or per email domain block for abuse.
- Trial features: Full premium features during trial, within a stated AI credit allowance and export allowance set in admin.
- Conversion rules: At trial end, the user downgrades to Free automatically, with no charge if no card was taken, and with a charge only after clear authorization if a card was taken. The user keeps viewing and downloading documents they created. Premium editing, premium templates, and premium exports lock until they subscribe. The system must never lock a user out of viewing their own CV.
- Billing terms disclosure: Trial length, what happens at trial end, monthly and annual prices, renewal date, and cancel method must be shown before trial start and before any payment, in plain language, on the checkout and account pages.
- Never charge without appropriate authorization. No dark patterns, no hidden renewal, no pre ticked consent.

### SUBSCRIPTIONS AND PAYMENTS
- Support monthly and annual subscriptions through Stripe, or another suitable provider if Stripe is not available for the business at launch. Annual must show the saving clearly, as monthly equivalent and total.
- Tax and invoicing: As a Czech trade business, include VAT handling and invoice generation for EU customers in the payment design, and confirm the exact VAT treatment with Ali's accountant before launch. Do not invent tax rates in code comments as if they were advice.
- Cancel: Cancel in the account, in a small number of clicks, with immediate confirmation, end of period access, and a clear record. Do not require contacting support to cancel.
- Refunds: Publish a refund policy before launch, and handle refund requests through Stripe and admin, with a log.

## 15. USER DASHBOARD

Include profile, saved CVs, saved letters, document history, templates, downloads, AI credits, subscription, and account settings.

Allow users to reuse their candidate profile across multiple documents, and to create job specific versions from one profile without duplicating the profile.

Add, from review:
- Job specific versions list, with target role, target country, and last edited date per version, and a compare view for two versions.
- Share and review link: A read only share link for a CV, for a friend, mentor, or reviewer to view and comment, without editing the original. This link is also the bridge to the NVConsult human review upsell.
- Human review upsell: A clear, optional offer for NVConsult free CV review and paid CV creation, linked from the dashboard and from ATS results, with no pressure copy and no fake urgency. The human review must be a real service with a real turnaround note, not an automated message pretending to be human.
- Download history and export history, so a user can see what they exported, when, and in which format.

## 16. ADMIN PANEL

Include user management, template management, AI prompt management, country management, occupation management, feature controls, free and premium entitlements, trial configuration, subscription management, AI usage analytics, export monitoring, and system logs.

Administrators must be able to add templates, change plan limits, change trial rules, add country packs, and update AI prompts without rewriting application code.

Add, from review:
- Versioning for templates, prompts, and country packs: every change creates a new version, with preview, publish, and rollback. A published template must not change silently for existing users without a version note.
- Content governance: Country packs and occupation starter content show source, last verified date, and reviewer. Out of date packs are flagged for review.
- Export monitoring: Export success rate, failure rate by template and format, and average export time, without logging CV content.
- Usage analytics: Counts of documents, exports, AI credits used, trial starts, trial conversions, and cancellations, aggregated, without reading personal CV text for analytics.
- Feature flags: Turn a template, language, country pack, or AI feature on or off per plan or globally, without a deployment.

## 17. TECHNICAL ARCHITECTURE

Inspect the development environment before selecting final technologies. Environment checked 4 November 2026: Node 24.22.1 and npm 10.9.4 available, Python 3.12.3 available, no local Postgres installed. Therefore use a hosted Postgres service for development and production, or a containerized Postgres, not a local Postgres install assumption.

Prefer: Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, secure authentication, modular AI provider integration, object storage for photos and exports, and background processing where required (for example, export jobs and AI jobs that take time).

Separate, as modules with clear boundaries:
- Candidate profile data.
- Document content.
- Template definitions.
- Rendering logic.
- AI generation.
- Subscription entitlements.
- Export processing.
- Country and language packs.
- Authentication and authorization.

Build a reusable template engine and document rendering abstraction, so a new template is a template definition plus styles, not a copy of the whole builder. The same rendering abstraction must feed PDF, DOCX, and PNG, so a document does not look different in each format without a documented reason.

Modularity for login split: Auth is a separate module with an interface, so changing from shared NVConsult login to separate Studio login, or to single sign on, does not require rewriting the builder, templates, or billing.

Object storage: Photos and generated exports are stored in object storage with signed access, not in the database as blobs, and with deletion on document deletion where the user requests it.

## 18. SECURITY AND PRIVACY

Implement secure authentication, role based permissions, file upload validation, rate limiting, secure API access, data deletion, GDPR conscious data management, secure environment variables, and audit logs.

CV data is personal information. Protect it appropriately.

Add, from review:
- Upload validation: file type, size, and content checks for photos and CV imports, with rejection messages that do not leak system details.
- Rate limiting on auth, AI generation, and export endpoints, with clear user facing messages when a limit is hit.
- No training on user data: User CVs, letters, and job descriptions are never used to train AI models, unless the user gives separate, explicit consent for a specific purpose. State this in the privacy policy.
- Data deletion: Delete account, documents, photos, exports, and AI logs for that account on request, with a confirmation and a completion record. Backups must expire on a stated schedule.
- Access control: Users can only access their own documents, unless they explicitly share a read only link. Admin access to user documents is logged, limited, and only for support with a recorded reason.
- Audit logs: Login, subscription changes, trial starts, export failures, and admin changes are logged with time, actor, and action, without logging CV content or secrets.

## 19. GROWTH, SEO, AND ANALYTICS

Add, from review, as part of the product, not as an afterthought:
- SEO landing pages per template, per country pack, and per occupation, generated from template and country data, with real content, not thin placeholder pages.
- NVConsult content link: Guides and country pages on nvconsult.eu link to the relevant Studio template and country pack, and Studio pages link back to NVConsult consultation where relevant, with no hard coded URLs in templates.
- Analytics: Measure signups, trial starts, conversions, template use, export success, and churn, aggregated and privacy conscious. Do not track CV text, job description text, or personal details for marketing analytics.
- Feedback loop: In product feedback for templates and AI suggestions, with a simple rating and optional comment, reviewed in admin, used to improve templates and prompts.

## 20. DEVELOPMENT APPROACH

Do not attempt to build everything in one unstructured generation. Work in phases, with a tested, reviewable increment at the end of each phase:

Phase 0. Repository setup: Create the GitHub repository structure, README, PROMPT.md, PROJECT_STATUS.md, .env.example, linting, and CI test skeleton. Confirm remote, visibility, and branch rules with Ali.
Phase 1. Product research and planning: Competitor research doc, Chinese demand gate research, architecture doc, database design, MVP scope confirmation, and open decisions list (price, Stripe account, AI provider, domain, hosting). No feature code is claimed complete in this phase.
Phase 2. Architecture and database design: Finalize schema, template engine design, rendering abstraction, auth module boundary, and entitlement model.
Phase 3. Design system and frontend: Design tokens, components, dashboard shell, and mobile layouts, with no hard coded copy in components where admin copy is required.
Phase 4. Authentication and user profiles: Shared login initial implementation, profile reuse, and account settings.
Phase 5. Template engine: Engine plus version 1 set of 10 templates, each passing the distinctness test and visual checks.
Phase 6. CV builder: Live editor, import, onboarding wizard, autosave, version history, and job specific versions.
Phase 7. PDF, DOCX, and PNG exports: Export engine plus automated template tests for long content, multilingual text, photos, and two page layouts.
Phase 8. AI content generation: AI writer, job tailoring, prompt management in admin, credit limits, and guardrails.
Phase 9. Supporting career documents: Letter studio, matching designs, and bundles.
Phase 10. ATS analysis: Heuristic analysis, job matching, and recommendations, with disclaimers.
Phase 11. Country and language intelligence: Version 1 country packs and languages, with sources and last verified dates.
Phase 12. Free and premium monetization: Entitlements, trial, Stripe monthly and annual, VAT invoices, cancel and refund flows.
Phase 13. Admin dashboard: Full admin panel, versioning, feature flags, and monitoring.
Phase 14. Automated testing: Full test suite, visual regression, export tests, security checks, and a pre launch checklist.
Phase 15. Deployment preparation: Production hosting, backups, monitoring, terms, privacy policy, refund policy, and launch checklist.

Prioritize a functional, polished core product before adding advanced features. If a phase reveals that a feature cannot meet quality or export standards, cut scope for that release and record it in PROJECT_STATUS.md, rather than shipping a broken version and claiming it is complete.

Definition of done, for every phase: Code is in the repository, tests pass, the feature is tested as a visitor (logged out where relevant, mobile, full click through), export output is inspected where relevant, docs are updated, and PROJECT_STATUS.md is updated. A preview or screenshot alone does not count as done.

## 21. DELIVERABLES, VIA THE REPOSITORY

Provide, in the repository, not as manual drops:
- Complete source code.
- Database schema and migrations.
- Environment variable example (.env.example).
- Installation instructions.
- Development instructions.
- Deployment instructions.
- Automated tests, with test reports in CI.
- API documentation.
- Architecture documentation.
- Feature status documentation, kept current in PROJECT_STATUS.md and docs/feature-status.md.

Maintain PROJECT_STATUS.md throughout development. Never claim a feature is complete unless it works and has been tested.

## 22. OPEN DECISIONS, STILL NEEDED BEFORE PAYMENTS AND AI GO LIVE

These are not blockers for Phase 0 and Phase 1, but they are blockers for a commercial launch, and must be decided by Ali, not invented by Muse:
- Final price for monthly and annual premium, and currency. Starting defaults in section 14 are configuration defaults, not prices.
- Stripe account owner, business details, and VAT treatment confirmation. Update, increment 11: Stripe is on hold per owner decision, to be added later. No Stripe integration work beyond the existing null placeholder config was done in increment 11.
- AI provider choice and budget cap for AI credits, plus fallback provider if the primary is unavailable. Update, increment 11: AI provider is now Muse AI, key and budget cap pending. Connected Muse AI is ready for a key and is NOT live until the owner adds a key (variable name only: GCS_AI_API_KEY) and sets a budget cap (variable name only: GCS_AI_BUDGET_CAP). No budget cap has been set yet. The writer falls back to the existing local rule based writer when no key is configured, with all guardrails unchanged.
- Domain or subdomain for the tools site, and the exact nvconsult.eu link locations. Note, 4 November 2026: the tools site domain idea is on hold. Do not check domain availability and do not purchase anything until Ali reopens it. Use placeholder domain configuration only. Update, increment 11: first launch is on nvconsult.eu, separate domain later.
- Hosting provider for the Next.js app, hosted Postgres provider, and object storage provider. Update, increment 11: hosting plan completed in docs/deployment-preparation.md section 10, provider not chosen, no deployment executed.
- GitHub repository name, owner, and visibility.
- Privacy policy, terms, and refund policy final wording, with a legal check for GDPR and consumer rights. Update, increment 11: legal docs completed in the repo in docs/legal/ (privacy policy, terms of service, refund policy, trial and billing disclosure, plus a single owner to confirm list), finalized for owner review only, legal check recommended before live, not published on any live site. Refund window, human review turnaround, and human review price are explicit owner to confirm placeholders, never invented.
- Human review service details for the NVConsult upsell: turnaround, scope, and price or free scope, so the dashboard offer is honest. Update, increment 11: human review scope completed in docs/human-review-scope.md, turnaround and price owner to confirm, free resume review and free LinkedIn review remain free extras.

Until these are decided, the system must be built with placeholders and configuration, not with invented prices, invented legal wording, or a fake payment flow.

## 23. FINAL OBJECTIVE

Deliver a complete, commercially viable Global Career Studio that can operate as a standalone SaaS business, with a polished version 1 core, a clear Phase 2 path to 20 templates, 30 countries, and more languages, and a repository that Ali owns and can hand to another developer without losing the history.

The application must be suitable for worldwide users and capable of producing professional, editable, high quality career documents.

Build for real customers, not merely for a visual demonstration.

End of rewritten prompt v2.
