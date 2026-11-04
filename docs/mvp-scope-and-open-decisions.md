# MVP Scope and Open Decisions - Phase 1
Date: 4 November 2026
Status: Scope confirmation for Phase 2 onward. No code is claimed as built from this document.

## Version 1, what must work before launch

Auth and profile:
- Signup, login, password reset, account settings, one candidate profile per account, profile reuse across documents.

Builder:
- 10 distinct templates, passing the distinctness test in PROMPT.md v2: ATS Minimal, Modern Professional, Executive, Corporate, Elegant, European, US Resume, UK CV, Sidebar, Two-column.
- Live editor with autosave, version history, section reorder, custom sections, photo crop, margins and spacing, undo and redo, and mobile usable editing.
- Import from PDF and DOCX, with a correction step before import becomes a document. LinkedIn import where permitted, or a guided paste import with an honest limitation note if direct import is not available.
- Onboarding wizard by target country or market, occupation, and experience level, with template, paper size, photo, and section order suggestions.

Exports:
- PDF with selectable text, correct A4 and US Letter, accurate pagination.
- Genuinely editable DOCX, tested by opening, editing, saving, and re exporting.
- PNG high resolution on Premium.
- Overflow warning with trim, spacing, or two page options, never clipping or overlapping.

AI and letters:
- AI writer for summaries, bullets, achievements, skills, projects, education, certifications, and bios, with job description tailoring, missing info prompts, and no fabricated qualifications.
- Letter studio for the core types in PROMPT.md v2, with matching design where appropriate.
- ATS heuristic analysis, with what was measured, what was not measured, and top three fixes, plus a paste test for text order.

Countries and languages, version 1 only:
- Countries and markets: US, Canada, UK, Germany, Europe, Australia, New Zealand, Global/Universal.
- Languages: English, German, French, Spanish.
- Each country pack with terminology, spelling, paper size, photo guidance, length guidance, section order, source notes, and last verified date.
- Chinese is Phase 2 gated, see docs/chinese-demand-gate.md.

Free and premium, starting defaults from PROMPT.md v2, all configurable in admin:
- Free: 2 saved documents, 3 to 5 templates from the version 1 set, basic AI credits per month, basic cover letters, standard PDF, basic customization. Free PDF is genuinely usable, no watermark trap, no TXT only trap.
- Premium: All 10 version 1 templates, advanced AI, job tailoring, advanced ATS, full letters, DOCX, high resolution PNG, advanced customization, more storage, higher AI limits, premium bundles.
- Trial: 7 days, no card, one per account, full premium within a stated AI and export allowance, downgrade keeps view and download, premium editing locks. All trial values configurable.
- Billing: Stripe monthly and annual, cancel in account with immediate confirmation and end of period access, refund policy published before launch, VAT and invoices for EU customers with accountant confirmation.

Dashboard and admin:
- Dashboard: Profile, saved CVs and letters, job specific versions, document history, templates, downloads, AI credits, subscription, settings, share and review link, human review upsell to NVConsult.
- Admin: Users, templates with versioning, AI prompts with versioning, countries with versioning, occupations, feature flags, entitlements, trial, subscriptions, AI usage analytics without CV content, export monitoring, system logs, audit logs.

## Phase 2 backlog, explicitly not version 1

- Templates 11 to 20: Creative, Academic, Canadian, Australian, Technical, Financial, Healthcare, Engineering, Timeline, Premium Classic.
- Countries beyond the version 1 set, up to the original 30, in batches with verified sources.
- Languages beyond version 1, gated by demand and quality, including Chinese if it passes its gate, plus Urdu and others from v1 as later candidates.
- Full job tracker, interview preparation, salary tools, portfolio hosting, and employer tools. Job versions and share links in version 1 are not a full tracker.
- One time or non auto renewing pricing, only after monthly and annual are stable and refund and expiry rules are designed.

## Non goals for version 1

- A job board, employer hiring tools, recruitment agency features.
- Invented employer data, salary data, or visa rules. Visa advice stays on NVConsult, with a link, not inside the builder.
- A second separate builder for NVConsult. One integrated application only.

## Definition of done, for every later phase

Code is in the repository, tests pass, the feature is tested as a visitor (logged out where relevant, mobile, full click through), export output is inspected where relevant, docs are updated, and PROJECT_STATUS.md is updated. A preview or screenshot alone does not count as done. Never claim a feature is complete unless it works and has been tested.

## Open decisions, blockers for commercial launch, not for Phase 1 planning

1. Price: Monthly and annual premium price, currency, and any regional pricing. Starting defaults in PROMPT.md v2 are configuration defaults, not prices.
2. Stripe: Account owner, business details, VAT treatment confirmation with accountant, invoice format.
3. AI provider: Provider, model, budget cap, fallback provider, and credit cost per generation.
4. Domain: Tools site domain or subdomain, and exact nvconsult.eu link locations.
5. Hosting: Next.js host, hosted Postgres provider, object storage provider, backup and rollback plan, data location for GDPR.
6. GitHub: Repository is already saeedr123/global-career-studio, public visibility as created. Confirm if public is intended, or change to private before launch content and any sensitive docs are added.
7. Legal: Privacy policy, terms, refund policy, and trial and billing disclosure final wording, with a legal check for GDPR and consumer rights.
8. Human review: NVConsult free review scope, paid creation scope, turnaround, and price or free scope, so the dashboard offer is honest.
9. Brand: Final brand presentation for Global Career Studio versus NVConsult, logo, colours, and footer operator line, consistent with NVConsult trade name rules where the link is shown.
10. Launch market: Primary launch market for pricing and country packs, and whether EUR is the launch currency.

Until these are decided, build with configuration and placeholders, not with invented prices, invented legal wording, or a fake payment flow.

## Phase 2 next steps, after Ali approves Phase 1

- Finalize Prisma schema from docs/database-design.md, with migrations in a test database, not production.
- Build design system and dashboard shell, with mobile layouts.
- Build template engine with the first 2 templates as a proof, ATS Minimal and Modern Professional, and prove PDF and DOCX export quality before adding the remaining 8.
- Then build the builder, import, and editor, in that order, with export tests after each template batch.

End of MVP scope and open decisions, Phase 1.
