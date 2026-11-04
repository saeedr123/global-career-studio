# Competitor Research - Phase 1
Date: 4 November 2026
Status: Research only. No feature is claimed as built from this document.
Method note: Findings below come from secondary review and comparison pages found by web search on 4 November 2026, not from a paid trial of every product and not from every vendor pricing page directly. Prices change by region and by checkout, and several sources disagree on small details. Treat every price as a range to recheck on the official pricing page before any pricing decision. Where sources disagree, that disagreement is recorded, not smoothed over.

## Summary pattern, across the market

1. The dominant commercial pattern is build free, download paid. Many leading builders let a user build for free, then require payment for a formatted PDF or DOCX download. The free download, where it exists, is often TXT only.
2. The dominant complaint pattern is billing, not template quality. Trustpilot style reviews for Resume.io and Zety repeatedly cite trial to subscription conversion, four week billing cycles, and cancellation friction. Product quality reviews are generally positive. Billing transparency is therefore a product feature, not a legal footnote.
3. The free tier honesty gap is the clearest opening. FlowCV and Teal are repeatedly cited as genuinely free for PDF download, with limits on AI, templates, or number of documents, not on getting a usable file. Global Career Studio should copy that honesty: free PDF that is genuinely usable, limits on count, templates, AI credits, and premium exports, not a watermark trap or a TXT only trap.
4. ATS claims are overstated across the market. Several vendors claim 100 percent ATS compliance. No vendor in this research provided a reproducible ATS test. Global Career Studio must not copy that claim. Use heuristic checks, show what was measured, and show the paste test.
5. Design tools are not ATS tools. Canva templates are repeatedly reported to break parsing because of two column layouts, floating text boxes, icon contact rows, and text rendered as graphics. A two column template in Global Career Studio must pass a text order test before it is called ATS friendly, and the ATS Minimal template must be single column by design.
6. International and multilingual support is a supply signal, not a proven Studio demand signal. Many builders list Chinese, Japanese, Korean, Arabic, and other languages. That shows competitors think the market is large. It does not prove Global Career Studio users want Chinese first. See docs/chinese-demand-gate.md.

## Competitor profiles

### Resume.io
- What it is: Web based resume and cover letter builder, founded 2016, based in the Netherlands, operating under Career.io in some sources.
- Templates: Around 30 templates in secondary sources, organised as Professional, Modern, Simple, Creative, and a dedicated ATS collection including Prime ATS, Simple ATS, and Pure ATS. One source says free users are limited to the Vancouver template.
- Exports: PDF and DOCX on paid plans in secondary sources. DOCX is reported as available on only eight named templates in one comparison (Stockholm, New York, Sydney, Dublin, Athens, Brussels, Prague, Shanghai), which needs a direct check before relying on it.
- Free plan, as reported: 1 resume, 1 cover letter, TXT downloads only. No formatted PDF on free in most sources. One source also mentions a basic PDF for free, which conflicts with the TXT only majority. Mark as unverified until the official page is checked.
- Paid, as reported: 7 day trial at 2.95 USD, auto renewing at 29.95 USD every 4 weeks. Quarterly at 49.95 USD per 3 months. Prices checked in secondary sources on 29 September 2026 and 1 November 2026.
- AI: AI resume builder, sample sentences by job title, skill suggestions, keyword suggestions, ATS checker in some sources.
- Complaints pattern: Unexpected recurring charges, difficulty cancelling, lack of upfront billing clarity, and in some Trustpilot excerpts, charges after a confirmed cancellation. Those are user reports, not proven billing faults for every user, but the pattern is repeated across pages.
- Gap for Studio: Free PDF that is usable, trial with no card and a clear downgrade that keeps view and download, and DOCX that is genuinely editable on all premium templates, not a subset.
- Sources: https://resufit.com/blog/resumeio-review-pricing-templates-worth-it/ , https://hereflowai.com/resume-io-review-2026/ , https://www.trustpilot.com/review/resume.io

### Zety
- Templates: 18 templates in secondary sources, with fine layout control over margins, spacing, and date formats, and a deep pre written phrase library.
- Free plan, as reported: Build and preview free, download TXT only. No formatted PDF on free.
- Paid, as reported: Trial at 1.95 USD for 14 days, auto renewing at about 25.95 USD every 4 weeks, which is 13 cycles per year. Annual at about 71.40 USD per year in one source. One comparison calculates the forgotten trial path at 337.35 USD per year, which is the arithmetic of 13 times 25.95, not a separate price.
- Complaints pattern: Same as Resume.io, trial conversion surprise and cancellation friction, with a Trustpilot rating around 4.2 from 11,600 plus reviews in early 2026 in one source.
- Gap for Studio: Do not use a 4 week billing cycle as the default. Use monthly and annual, state the renewal date in plain language, and make cancel a dashboard action with immediate confirmation.
- Sources: https://rankite.com/blog/best-resume-software , https://canopy.press/best-ai-resume-builders-in-2026-free-vs-paid/

### Enhancv
- Strength: Visual design quality, creative and startup roles, section level feedback in some comparisons.
- Free, as reported: 7 day trial, watermarked downloads in one comparison, no card in another. Those two descriptions conflict on card and watermark details. Mark as unverified.
- Paid, as reported: Around 24.99 USD per month in one comparison, around 16.50 USD promotional in another, around 80 USD per 6 months in a third. Price varies by cohort and region, do not pick one figure as official.
- Gap for Studio: Creative templates must still pass a parse test, or they must be labelled as design first, not ATS first. Enhancv shows that visual leadership alone does not solve the ATS trust problem.
- Sources: https://www.jobsprout.ai/blog/best-cv-cover-letter-tools , https://rankite.com/blog/best-resume-software

### Novoresume
- Strength: Template design, built in ATS checker with live feedback, up to 10 page CVs on Premium in one source.
- Free, as reported: One page resume, basic templates. One source says free PDFs carry branding.
- Paid, as reported: Monthly around 19.99 to 21.99 USD in different sources, one month Premium at 23.99 USD one time, 3 months at 49.99 USD, 1 year at 199.99 USD, with no auto renewal in one source. That no auto renewal claim is a differentiator if confirmed on the official page, and it is the most honest pricing pattern found in this research.
- AI: Limited in free, section suggestions in paid in some sources, no full AI generation in others. Mark as mixed.
- Gap for Studio: Consider a one time or non auto renewing option later, after Stripe monthly and annual are stable. Do not promise it in version 1 until the refund and access expiry rules are designed.
- Sources: https://rankite.com/blog/best-resume-software , https://www.jobsprout.ai/blog/best-cv-cover-letter-tools

### Kickresume
- Templates: Over 35 to 40 templates in secondary sources, plus cover letters, personal websites, and an AI writer on Premium.
- Free, as reported: 4 basic resume templates, 4 cover letter templates, 1 website template, unlimited PDF downloads on basic templates in several sources. AI Writer and phrase library are Premium.
- Paid, as reported: Around 24 USD per month, 54 USD per quarter, 96 USD per year in one source. Another source says from 8 USD per month billed yearly. The yearly figure is consistent with 96 per year divided by 12.
- Strength: Design quality and student offers in some sources.
- Gap for Studio: Kickresume proves a free PDF can coexist with a paid AI tier. Studio should not gate the first usable PDF behind AI credits.
- Sources: https://affine.pro/blog/ai-resume-builder-free , https://www.jobsprout.ai/blog/best-cv-cover-letter-tools

### FlowCV
- Free, as reported: One resume and one cover letter, unlimited PDF downloads, no watermark, access to 50 plus templates and full design customization in several sources. Guest editing without an account in one test on 30 October 2026.
- AI: Pro only in that test. Clicking AI opened a Pro upgrade message, while the free plan still included unlimited PDF downloads.
- Paid, as reported: Pro around 10 USD per month in one source, not independently verified in another. Mark as to recheck.
- Strength: The most cited honest free tier in this research, plus GDPR privacy positioning in one comparison.
- Gap for Studio: FlowCV shows that a single free document can still feel generous if the PDF is real. Studio free default of 2 documents is more generous, and should be kept if unit economics allow.
- Sources: https://affine.pro/blog/ai-resume-builder-free , https://www.gainrep.com/resources/best-free-resume-builder/

### Rezi
- Focus: ATS keyword matching, bullet level editor, Rezi Score.
- Free, as reported: 1 resume, 3 PDF downloads total in several sources, unlimited Word and TXT in one comparison. AI within the free plan in one test, limited in others.
- Paid, as reported: 29 USD per month, lifetime 149 USD in several sources.
- Complaints and limits: The 3 download lifetime cap is the main friction, even though the ATS focus is strong.
- Gap for Studio: Do not copy a lifetime download cap. A monthly download allowance is clearer than a lifetime cap that punishes a user for fixing a typo.
- Sources: https://www.jobsprout.ai/blog/best-cv-cover-letter-tools , https://affine.pro/blog/ai-resume-builder-free

### Teal
- Focus: Job tracker plus resume builder, LinkedIn import, unlimited resumes on free in several sources.
- Free, as reported: Unlimited resumes and PDF downloads, 10 templates in one source, 5 bullet credits, 2 summary credits, and 2 cover letter credits in a test on 30 October 2026. Basic keyword matching on free.
- Paid, as reported: Teal Plus around 9 USD per week in one source, 13 USD per week in another, 29 USD per 30 days in a third. Weekly pricing is a friction point and should not be copied.
- Strength: Job specific versions and tracker are the model for Studio job versions, but Studio should not copy weekly billing.
- Gap for Studio: Import from LinkedIn and job tracking are high value, but Studio version 1 should ship import and job versions first, and a full tracker only after the core builder is stable.
- Sources: https://affine.pro/blog/ai-resume-builder-free , https://www.gainrep.com/resources/best-free-resume-builder/

### VisualCV
- Templates: 30 plus templates in one source, portfolio site hosting, performance analytics.
- Free, as reported: First resume free, Pro for unlimited and more templates.
- Paid, as reported: Around 12 USD per month in one source.
- Strength: LinkedIn integration in several sources.
- Gap for Studio: Portfolio hosting is a Phase 2 idea, not version 1. Do not promise analytics that read CV content.
- Source: https://www.gainrep.com/resources/best-free-resume-builder/

### Resume Genius
- Templates: 32 designs in the builder in one source, 35 plus in another, plus a large free Word and Google Docs template library in its FAQ as reported by a third party.
- Free, as reported: Builder, AI summary generator, checker, cover letter builder, but resume downloads TXT only. Cover letter downloads PDF and Word on free in one source, which is an exception worth checking directly.
- Paid, as reported: 14 day trial at 2.95 USD, auto renewing at 23.95 USD every 4 weeks, annual at about 95.40 USD per year.
- Gap for Studio: The guided wizard is the strength to learn from. Studio onboarding should be wizard first, blank form second.
- Sources: https://www.careerkit.me/blog/resume-genius-review , https://cvgenius.com/blog/cv-help/resume-genius-review

### Canva
- Strength: Design library, free PDF export, huge template count.
- ATS risk, as reported in detail: Two column layouts reorder timeline text, floating text boxes break association, icon contact rows import as blanks, text rendered as graphics is invisible to parsers, and headers and footers are skipped by some parsers. A plain single column export can pass a paste test, but default templates are optimised for visual impact, not parsing.
- Implication for Studio: Every Studio template, including Sidebar and Two-column, must pass a paste order test and a selectable text test before release. If a template fails, label it as design first and recommend ATS Minimal for portal uploads, do not label it ATS friendly.
- Sources: https://hireflow.net/blog/is-canva-resume-ats-friendly-honest-answer , https://www.getatsready.com/guides/canva-resume-ats.html

### Europass
- What it is: EU standard CV, free, from the European Commission, with structured sections, CEFR language levels A1 to C2, EQF and ISCED education levels, and DigComp digital skills in some guides.
- Structure: Personal information, work experience in reverse chronological order, education and training, language skills, skills, and additional information. Some guides note no personal statement at the top in the classic structure, while others include an About Me section in newer versions. Mark that detail as version dependent and check europa.eu/europass directly before building the European template.
- Use case: EU institutions, public bodies, cross border education, and EURES. Not the only accepted format anywhere, and it often runs to 2 to 3 pages.
- Implication for Studio: The European template in version 1 should be Europass structure inspired, not a copy of the official Europass visual design, and it must state clearly when Europass is required and when a shorter modern CV is better.
- Sources: https://www.monster.com/career-advice/resume/europass-cv , https://www.qarera.com/resume-templates/europass

## Comparison table, secondary sources, 4 November 2026

This table is a research summary, not an official price list. Recheck official pages before launch.

- Resume.io: Free TXT only in most sources, paid 2.95 trial then 29.95 per 4 weeks, 30 plus templates, PDF and DOCX on paid.
- Zety: Free TXT only, paid 1.95 trial then 25.95 per 4 weeks, 18 templates, deep phrase library.
- Enhancv: Trial based free in sources, paid around 25 per month with wide variation, design led.
- Novoresume: Free 1 page, paid around 20 per month, one time options reported, ATS checker.
- Kickresume: Free 4 templates with real PDF, paid around 24 per month or 96 per year, 35 plus templates, AI on Premium.
- FlowCV: Free 1 resume with unlimited watermark free PDF, AI on Pro, Pro around 10 per month to recheck.
- Rezi: Free 1 resume with 3 PDF downloads, paid 29 per month or 149 lifetime, ATS keyword focus.
- Teal: Free unlimited resumes with PDF, limited AI credits, paid weekly in sources, job tracker plus LinkedIn import.
- VisualCV: Free first resume, paid around 12 per month, portfolio hosting.
- Resume Genius: Free TXT only for resumes, paid 2.95 trial then 23.95 per 4 weeks, 32 templates, guided wizard.
- Canva: Free PDF, design led, ATS parsing risk on default templates.
- Europass: Free official EU standard, CEFR and EQF structure, often long, not required everywhere.

## Opportunities for Global Career Studio, in priority order

1. Honest free PDF: 2 free documents, 3 to 5 free templates, standard PDF, no watermark trap, no TXT only trap. This alone beats Resume.io, Zety, and Resume Genius on first use trust.
2. Honest trial: 7 days, no card, one per account, downgrade keeps view and download, premium editing locks. State renewal date, monthly and annual prices, and cancel path before trial start.
3. Honest ATS: Heuristic checks only, paste test, single column ATS Minimal, and a clear label for design first templates. Never claim 100 percent ATS compliance.
4. Honest DOCX: Genuinely editable DOCX on all premium templates, tested by opening, editing, and saving, not a PDF image inside Word.
5. International first, not US only: Version 1 packs for US, Canada, UK, Germany, Europe, Australia, New Zealand, and Global/Universal, with photo, length, spelling, and paper size guidance per pack, and a last verified date per pack.
6. Human layer: NVConsult free CV review and paid CV creation as an optional upsell, with a real turnaround note. No competitor in this set offers that as a built in human service linked to a consultation business.
7. Import and job versions: PDF and DOCX import, LinkedIn import where permitted, and one profile with multiple job tailored versions. Teal and VisualCV show the value, but Studio can make it the core, not an add on.
8. Mobile builder: Most competitors are desktop first in practice. A phone usable builder, with move up and down editing instead of only drag and drop, fits NVConsult mobile traffic.
9. No 4 week billing trap: Monthly and annual only in version 1, with annual saving shown as total and monthly equivalent. Weekly and 4 week cycles are excluded by design in version 1.

## What not to copy

- Do not copy TXT only free downloads.
- Do not copy 4 week auto renewal as the default trial path.
- Do not copy 100 percent ATS compliance claims.
- Do not copy lifetime download caps.
- Do not copy weekly billing.
- Do not copy design templates that fail a text order test and are still labelled ATS friendly.
- Do not copy a free plan that locks the user out of viewing their own document after trial end.

## Unverified items, to check directly before Phase 2 design

- Resume.io DOCX template subset, free PDF versus TXT conflict, and official quarterly price.
- Enhancv trial card and watermark details, and official monthly price by region.
- Novoresume no auto renewal claim, and official one time prices.
- FlowCV Pro price.
- Resume Genius free cover letter PDF claim.
- Europass current structure, About Me placement, and page length guidance on europa.eu/europass.
- All official pricing pages, in EUR for the Studio launch market, not only USD secondary reports.

End of competitor research, Phase 1.
