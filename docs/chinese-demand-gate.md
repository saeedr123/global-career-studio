# Chinese (Simplified) Demand Gate - Phase 1
Date: 4 November 2026
Decision in PROMPT.md v2: Chinese (Simplified) is NOT in version 1. It is a Phase 2 candidate, gated by demand and quality. This document records the evidence found so far, what it does and does not prove, and the exact gate for building it.

## Short answer

Competitor supply for Chinese is strong. Proof of demand from Global Career Studio's own audience is not yet established. Do not build Chinese in version 1 on supply alone. Build the system Unicode ready in version 1, then run the validation steps below, and build Chinese only if at least two gate criteria are met.

## Evidence for supply

1. Resume.io recently added Chinese and Hindi, and described China and India as two of the largest professional markets in the world in its update note. Source: https://updates.resume.io/more-languages-chinese-and-hindi-now-supported!-175853
2. Several builders list Chinese among 10 to 21 supported languages, including StylingCV with 21 languages, ResumeMD with 6 languages including Chinese, Bespree with 14 languages including Chinese, and ResumeForge with 10 languages including Chinese. Sources: https://stylingcv.com/ai-resume-builder/ , https://resumemd.pro/ , https://bespree.com/resume
3. Bilingual tools exist specifically for Chinese speaking international students, with a Chinese in, English out model. One such tool states: write in Chinese, get a quantified ATS safe English resume, and notes the key China versus US difference as photo, age, and personal details expected in China, versus no photo, no age, and one page scannable in the US and UK and Australia. Source: https://resume.david-cells.com/
4. Country guides for Mainland China note: Jianli format, foreign companies often ask for Chinese and English versions, usually 1 page for graduates and 1 to 2 pages with experience, photo common but not required, follow the employer. Source: https://www.leaf-resume.com/en/guides/resume-by-country?contentLanguage=en&targetMarket=GLOBAL
5. Asian market context in one 2026 article notes a 340 percent year over year increase in AI powered job applications across Asia, driven by competitive tech hiring in Singapore, Tokyo, Seoul, Shanghai, and Bangalore, and notes that Chinese character formatting, Japanese rirekisho, and Korean formats have strict conventions that generic Western tools often fail. That article is a vendor style blog, not a primary market report, so treat the percentage as unverified and the formatting point as a useful risk note, not as demand proof. Source: https://apifeny-ai.vercel.app/blog/ai-resume-job-search-tools-asian-professionals-2026

## What this evidence does NOT prove

- It does not prove that NVConsult visitors, who are mainly students and workers from Asia and Africa moving to Europe and beyond, want a Chinese language CV builder. NVConsult's current audience evidence does not include a Chinese speaking segment.
- It does not prove that Chinese speaking users would pay for Studio, or that they would choose Studio over a local Chinese builder, a bilingual tool, or a free Europass style builder.
- It does not prove search demand in the Studio launch markets. No search volume, waitlist, or inquiry data for Studio was available in Phase 1.
- It does not prove AI quality in Chinese. Several builders claim native quality, but no independent test in this research verified Chinese AI output quality, tone, or formatting.

## Cost and risk of adding Chinese, to include in the gate decision

- Layout: Chinese characters are full width, which changes alignment, spacing, line breaks, and template width calculations. Templates must be tested separately in Chinese, not assumed to work because they work in English.
- Fonts: Embedded fonts must support Simplified Chinese glyphs in PDF, DOCX, and PNG, with correct licensing. A missing glyph or a fallback font can break a professional document.
- Conventions: A China market CV and a Chinese language CV for a US, UK, or EU employer are different products. One needs photo and personal details guidance for China, the other needs no photo and no age guidance for Western employers. Building only one and marketing it as both would be misleading.
- AI prompts: Prompts, occupation vocabularies, and ATS keyword sets must be reviewed by a Chinese speaking reviewer, not only machine translated. That reviewer cost must be budgeted.
- Support: Support replies, help pages, and error messages in Chinese would be expected if the interface is offered in Chinese. Interface translation alone is not enough.

## Demand gate, exact criteria

Build Chinese (Simplified) in Phase 2 only if at least two of the following are true, with evidence recorded in this file:

A. Waitlist or landing page interest: At least 100 signups or waitlist entries from users who select Chinese as a wanted language, or at least 200 visits to a Chinese language landing page with a signup rate at or above the site average, over a 60 day test. Numbers are starting thresholds, to be confirmed by Ali before the test, not final targets.
B. NVConsult inquiry evidence: At least 20 distinct NVConsult inquiries, consultation bookings, or audience messages in a 90 day period that mention Chinese speaking applicants, China market jobs, or a Chinese language CV need, counted from real messages, not from a survey prompt that suggests the answer.
C. Clear use case not served by version 1 languages: A documented segment, for example Chinese speaking international students in the UK, Germany, or Australia who need a Chinese draft converted to an English ATS safe resume, with at least 10 user interviews or test users who complete that task and rate the output as usable.
D. Partner or channel evidence: A partner, university, agency, or NVConsult channel that can bring Chinese speaking users at launch, with a written agreement or a confirmed test, not a verbal hope.

If only one criterion is met, do not build full Chinese generation. Instead, test a smaller step, such as a Chinese to English conversion guide, a bilingual template with English output, or a Chinese language landing page with a waitlist, and remeasure.

## Validation steps, in order, after version 1 launch

1. Add a language interest question to signup and to the NVConsult consultation form, with Chinese as one option among others, not as the only highlighted option.
2. Publish one Chinese language landing page, with honest copy: Chinese language support is in development, join the waitlist, no promise of a launch date until the gate is met.
3. Track waitlist signups, landing page visits, and NVConsult inquiries separately, with a weekly count in admin analytics, without reading CV content.
4. Run 5 to 10 usability tests with Chinese speaking test users on an English output from a Chinese draft, using a manual or AI assisted draft, and record where the output fails on tone, format, or personal details.
5. Cost the font, layout, prompt review, and support work, and present that cost alongside the demand numbers to Ali before a build decision.

## Architecture rule, already in PROMPT.md v2, restated here

Version 1 must be Unicode ready, with language packs, fonts, and prompts separated from code, so adding Chinese later is a language pack, font, and prompt task, plus layout testing, not a rebuild. RTL readiness in the layout system is also required in version 1, even though no RTL language ships in version 1, because the same separation makes later Arabic, Urdu, and other languages cheaper to add.

## Decision record, to update after validation

- Date of validation test start: not yet set.
- Waitlist count: not yet measured.
- NVConsult inquiry count: not yet measured.
- Interview count: not yet measured.
- Gate met: No, as of 4 November 2026.
- Build decision: Not yet made. Do not start Chinese generation until the gate is updated here with evidence.

End of Chinese demand gate, Phase 1.
