-- Seed the Template and CountryPack reference rows, Increment 15 fix.
-- The builder sends template and country pack ids as slugs, for example ats-minimal and us.
-- Document.templateId and Document.countryPackId are foreign keys to Template.id and
-- CountryPack.id, so a document create fails unless a row with that id exists.
-- These rows use the slug as the id, so the code slug and the database id are the same value.
-- Idempotent: ON CONFLICT DO NOTHING, safe to re-run.
-- Generated from apps/web/lib/builder-core.mjs TEMPLATES and apps/web/lib/packs-core.mjs COUNTRY_PACKS on 2026-11-05, not typed by hand.
-- Template paper sizes: US Resume uses US Letter, the rest use A4, matching the country pack guidance in the code.
-- CountryPack lastVerifiedAt uses the project review date 2026-11-04 from the code, which is a project review date only, no official source was rechecked.

INSERT INTO "Template" ("id", "slug", "name", "defaultPaperSize", "photoAllowed", "isActive", "createdAt", "updatedAt") VALUES
  ('ats-minimal', 'ats-minimal', 'ATS Minimal', 'A4', false, true, NOW(), NOW()),
  ('modern-professional', 'modern-professional', 'Modern Professional', 'A4', true, true, NOW(), NOW()),
  ('executive', 'executive', 'Executive', 'A4', true, true, NOW(), NOW()),
  ('corporate', 'corporate', 'Corporate', 'A4', true, true, NOW(), NOW()),
  ('elegant', 'elegant', 'Elegant', 'A4', true, true, NOW(), NOW()),
  ('european', 'european', 'European', 'A4', true, true, NOW(), NOW()),
  ('us-resume', 'us-resume', 'US Resume', 'US_LETTER', false, true, NOW(), NOW()),
  ('uk-cv', 'uk-cv', 'UK CV', 'A4', false, true, NOW(), NOW()),
  ('sidebar', 'sidebar', 'Sidebar', 'A4', true, true, NOW(), NOW()),
  ('two-column', 'two-column', 'Two-column', 'A4', true, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CountryPack" ("id", "slug", "name", "paperSizeDefault", "photoGuidance", "sectionOrderJson", "sourceNotes", "lastVerifiedAt", "isActive") VALUES
  ('us', 'us', 'United States', 'US_LETTER', 'No photo, by US convention, as noted on the US Resume template. If a posting asks for a photo, follow the posting, not this pack.', '["summary","experience","skills","education","languages"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true),
  ('canada', 'canada', 'Canada', 'US_LETTER', 'No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.', '["summary","experience","education","skills","languages"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true),
  ('uk', 'uk', 'United Kingdom', 'A4', 'No photo, by UK convention, as noted on the UK CV template. If a posting asks for a photo, follow the posting, not this pack.', '["summary","experience","education","skills","languages"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true),
  ('germany', 'germany', 'Germany', 'A4', 'Photo is optional in this pack. Do not add personal details an employer has not asked for. Check the posting first.', '["experience","education","languages","skills","summary"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true),
  ('europe', 'europe', 'Europe', 'A4', 'Photo is optional in this pack. Do not add personal details an employer has not asked for. Check the posting first.', '["experience","education","languages","skills","summary"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true),
  ('australia', 'australia', 'Australia', 'A4', 'No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.', '["summary","experience","education","skills","languages"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true),
  ('new-zealand', 'new-zealand', 'New Zealand', 'A4', 'No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.', '["summary","experience","education","skills","languages"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true),
  ('global', 'global', 'Global / Universal', 'A4', 'No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.', '["summary","experience","education","skills","languages"]'::jsonb, 'Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.', '2026-11-04', true)
ON CONFLICT ("id") DO NOTHING;

