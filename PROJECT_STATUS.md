# PROJECT_STATUS

## Current phase
Phase 2 increment 1: Complete for schema, scaffold, and template export proof (tested, see below). Phase 2 as a whole is NOT complete.

## Done
- Rewritten prompt v2 saved as PROMPT.md (4 Nov 2026)
- Version 1 scope agreed: 10 templates, 8 country/market packs, 4 languages, 7 day trial default
- GitHub connected 4 Nov 2026, verified as saeedr123 via API (status 200)
- Custom GitHub connector doc and helper created at workspace/custom-connectors/custom.github/
- Repository saeedr123/global-career-studio created on GitHub 4 Nov 2026 (public)
- Token updated to Contents Read and write, then initial push succeeded 4 Nov 2026: README.md, PROMPT.md, and PROJECT_STATUS.md all returned status 201, verified on the public repository page with 3 root files on main branch
- Phase 1 docs completed 4 Nov 2026 and pushed to GitHub: docs/competitor-research.md, docs/chinese-demand-gate.md, docs/architecture.md, docs/database-design.md, docs/mvp-scope-and-open-decisions.md (547 lines total, no em/en dashes found in check)

## Done in Phase 2 increment 1 (4 Nov 2026, tested)
- Prisma schema created at prisma/schema.prisma, from docs/database-design.md: 32 models and 14 enums, covering User, Profile and profile detail tables, Document, DocumentSection, DocumentVersion, DocumentExport, Template, TemplateVersion, CountryPack, CountryPackVersion, LanguagePack, Occupation, LetterTemplate, ATSAnalysis, ATSAnalysisResult, Plan, Subscription, Trial, AICreditLedger, AIUsageLog, ShareLink, HumanReviewRequest, AdminAuditLog, ExportLog, SystemLog, and FeatureFlag. UUID ids, UTC timestamps, and unique constraints as in the design doc. Root .env.example added with placeholders only, no real secrets. Prisma README added at prisma/README.md.
- Next.js scaffold created at apps/web/: Next.js 14.2.x (patched release, see Limitations), React 18, TypeScript, Tailwind. Home page states clearly that this is a scaffold and template proof, not a finished product, links to the project docs, and uses placeholder configuration only, with no prices, trial offers, or limits in UI copy. Production build passed (Next.js build, route / prerendered).
- Template engine proof created at packages/template-engine/ in TypeScript, with a rendering abstraction for two templates only: ATS Minimal (single column, standard headings, plain typography, no photo, no colour accents, parse friendly) and Modern Professional (single column, navy header, accent line under headings, larger headings, still parse friendly, distinct layout and typography, not only a colour change). The engine supports A4 and US Letter, single and two page intent, a photo flag (honoured by Modern Professional, not by ATS Minimal by design), and custom section order. Sample data is fictional, marked SAMPLE in code and output, and never presented as a real user.
- Export proof implemented with pdfkit (PDF, selectable text, not an image) and docx (DOCX with real headings, paragraphs, and lists, not a PDF image inside Word).
- Automated export test passed, 10 out of 10 cases, command: cd packages/template-engine && npm test. Cases: both templates, short sample and long sample, PDF and DOCX, plus custom section order and photo flag checks. Long PDFs have 2 pages, short PDFs have 1 page, at A4. Output files (local test-output folder, not pushed): ats-minimal-short.pdf 2168 bytes, ats-minimal-short.docx 7984 bytes, ats-minimal-long.pdf 3759 bytes, ats-minimal-long.docx 8588 bytes, modern-professional-short.pdf 2356 bytes, modern-professional-short.docx 7997 bytes, modern-professional-long.pdf 4186 bytes, modern-professional-long.docx 8593 bytes. PDF text extraction and DOCX text both contain the sample name (Sam Sample, fictional) and job title (Sample Project Coordinator).
- READMEs added for apps/web/ and packages/template-engine/, explaining how to run, test, and extend. Root .gitignore added for node_modules, build output, test output, and .env files.

## Explicitly NOT done in increment 1
- AI generation, Stripe payments, dashboard, letter studio, ATS analysis, and full country packs are NOT built. Only the database tables for those areas exist in the schema, as designed in Phase 1, with no working feature behind them.
- The remaining 8 version 1 templates are NOT built. Only ATS Minimal and Modern Professional exist.
- No migration has been run, and no database is connected. See Limitations.
- Phase 2 is NOT complete. Builder, import, editor, remaining templates, AI, letters, ATS, country and language packs, monetization, admin dashboard, automated testing beyond the export test, and deployment preparation all remain.

## Pending for the rest of Phase 2, in order
- Run Prisma validate and migrations against a test database, then generate the Prisma client (blocked in this environment, see Limitations).
- Build design system and dashboard shell, with mobile layouts.
- Build builder, import (PDF/DOCX with correction step, LinkedIn import where permitted or guided paste with honest limitation note), and editor (autosave, version history, job-specific versions).
- Add the remaining 8 version 1 templates, with export tests after each batch.
- Then, in PROMPT.md v2 order: AI generation, letter studio, ATS analysis, country/language packs, monetization, admin dashboard, automated testing, deployment preparation.

## Blocked and open decisions (unchanged, still block commercial launch)
- Price, Stripe account and VAT treatment, AI provider, domain/subdomain and nvconsult.eu link locations, hosting and GDPR data location, legal wording (privacy, terms, refund, trial and billing disclosure), human review scope and turnaround, brand presentation, launch market and currency, and GitHub visibility confirmation (repo is public as created).
- Payments and AI launch remain blocked on those decisions in PROMPT.md section 22 and in docs/mvp-scope-and-open-decisions.md.

## Limitations found in increment 1 (honest record, not hidden)
- Prisma CLI validation could NOT run in this environment. Installing prisma 6.14.0 failed three times with ECONNRESET during the engine binary download in postinstall, and a wasm fallback build failed with internal errors. The schema was instead checked with a structural parser (32 models, 14 enums, balanced braces, relation targets and referenced fields resolve, unique fields exist, no em/en dashes), plus manual review. Do NOT treat the schema as officially validated until prisma validate and a test migration pass on a machine where the engine download works.
- npm install in this workspace fails with a chown EPERM error on package binaries unless --no-bin-links is used. Both package READMEs record this, and npm scripts call binaries by file path so they work either way.
- The first PDF text extraction library tried, pdf-parse, gave flaky and inconsistent parse errors on valid PDFKit output (the same file passed once and failed the next run), while pdftotext and pdfjs-dist read every proof PDF correctly. The test now uses pdfjs-dist 3.11.174 for extraction, and pdf-parse was removed.
- Next.js was first installed at 14.2.18, which npm flagged with a security vulnerability warning. It was upgraded to a patched 14.2.35 release and the build passed again. Check for newer patched releases before any public deployment.

Never mark a feature complete unless it works and has been tested.
