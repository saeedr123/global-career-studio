# M0: Technical and Architectural Audit

CV Commerce Platform, Master Build Specification V4.0

- Date: 2026-11-17
- Milestone: M0 only. No product code was written or changed.
- Status: Partial. The audit is complete. Template design specifications are PROVISIONAL because the five reference images were not attached to this session (see Blocker B1).
- Approval gate: M1 must not start until the owner answers the decisions in Part A.

Everything marked "Verified" below was read from files or produced by commands run in this session on 2026-11-17. Anything marked "Not verified" or "Assumption" was not proven here.

---

## Part A: Blockers, conflicts and decisions needed before M1

Specification section 3.4 says: if an existing repository instruction conflicts with this specification, stop and report the conflict. These are reported here instead of being resolved silently.

### Blockers

| ID | Blocker | Effect | What unblocks it |
|---|---|---|---|
| B1 | The five CV reference images were NOT attached to this session. No image file exists in either repository or the session uploads. | Section 4 analysis cannot be done from the real images. Part C specs below are built only from the written descriptions in specification section 4 and are marked PROVISIONAL. | Attach the five images to the next session. The specs will be revised against them before M1 code. |
| B2 | Write access: this session can push only to `saeedr123/global-career-studio`, branch `claude/clever-thompson-rq95da`. `saeedr123/listing-photos-generator` was cloned read only (public repository, anonymous read). | No changes can be committed to the repository the specification calls primary. | Decision D1 below. If code must go into listing-photos-generator, a session must be started with that repository attached for push. |
| B3 | No 3D model assets exist in either repository (no GLB, no HDRI, no 3D dependencies). | M2 cannot show a realistic laptop without a licensed, unbranded model. | Decision D5 below. |
| B4 | Brand configuration for `modustemplates` was not supplied. | M5 style kit can only contain clearly marked DRAFT values. | Owner supplies colours, fonts and wording, or approves drafts later. |

### Conflicts with existing repository instructions

| ID | Conflict | Source | Specification V4 says |
|---|---|---|---|
| C1 | listing-photos-generator states it is not a CV tool and must not copy CV content from Global Career Studio. | `listing-photos-generator/docs/architecture.md` line 46 | Build a CV Mockup Studio in listing-photos-generator. |
| C2 | listing-photos-generator is scoped "Etsy only v1, digital products only" with niche packs for wedding, personal finance and small business planners (spreadsheets). Its mockups display a schematic sheet preview. | `listing-photos-generator/docs/mockup-engine.md`, `config/niche-packs.json` | Mockup Studio for CV templates, 3D WebGL. |
| C3 | Global Career Studio version 1 ships 10 templates, already built and tested. | `global-career-studio/PROMPT.md` section 5, `packages/template-engine/README.md` | 5 new reference-based template families. |
| C4 | Global Career Studio version 1 languages are English, German, French and Spanish. listing-photos-generator is English only in v1. | `global-career-studio/PROMPT.md` section 4, `listing-photos-generator/IDEA.md` line 18 | English and German first, others later and not claimed until tested. |
| C5 | Both repositories contain a package named `packages/template-engine` with unrelated meanings: CV document templates in Global Career Studio, Etsy listing image layouts in listing-photos-generator. | Both repositories | One shared template engine. |
| C6 | Four SVG mockups are stored with `qualityLabel: "premium"` and `status: "published"` although the repository's own docs say the check is declared only, not a human visual review, and no frame may be called premium until the owner approves. | `listing-photos-generator/packages/mockup-engine/mockups/*.json`, `docs/mockup-engine.md`, `PROJECT_STATUS.md` | Correct misleading premium labels. |
| C7 | Project documents name "Ali" as the decision owner. Specification V4 names Saeed Rasul. | Both `PROMPT.md` files | Owner: Saeed Rasul. No change made; recorded only. |

### Decisions requested from the owner

* [ ] **D1 Repository strategy.** Recommendation: build the CV document engine AND the Mockup Studio inside `global-career-studio` as separate packages and separate route groups, and copy (not depend on) the useful, licence-clean parts of listing-photos-generator (5 SVG frames with licence records, contain fit, licence gate, versioning, ICC verification). Reasons: the CV builder, CV data model and document exports already live here and are deployed; the canonical design spec must be imported by both products without cross-repository package publishing; and conflicts C1 and C2 say listing-photos-generator is deliberately not a CV tool. Alternatives: (a) Mockup Studio in listing-photos-generator, CV engine here, shared through a published package (adds versioning overhead and needs push access there); (b) a new third repository.
* [ ] **D2 Template scope.** Recommendation: add the 5 reference families as new definitions on the new canonical engine, keep the existing 10 templates working on the current engine until each is migrated and re-verified, then retire the old adapters. Nothing is removed to simplify.
* [ ] **D3 Language scope for this programme.** Recommendation: English and German are the tested target for M1 to M9. French and Spanish keep their existing builder status but are not claimed for the new templates until tested.
* [ ] **D4 Render worker.** PNG from PDF and DOCX visual checks need native tools (Poppler, LibreOffice) that a Vercel serverless function does not provide. Recommendation: a small containerised render worker (Poppler, LibreOffice, pinned fonts) for production PNG export, with the same container used in CI. Alternative for low cost: pdf.js plus a Node canvas inside the serverless function (Not verified on Vercel; slightly different rasteriser from the QA reference).
* [ ] **D5 3D assets.** Options: (a) commission or build one generic laptop in Blender, owned outright (cleanest licence); (b) CC0 sources only (licence verified per asset); (c) procedural laptop built from code geometry for M2, replaced later. Recommendation: (c) to unblock M2 with zero licence risk, then (a) for commercial quality.
* [ ] **D6 Font policy.** See Part H. Recommendation: two font profiles, "Compatible" (metric-compatible pairs so DOCX reflows identically in Word) and "Design" (OFL display fonts embedded in PDF, with installation links shipped in the Etsy package).

---

## Part B: Verified baseline

### B.1 Repositories inspected

| Repository | Commit | Access in this session | Relationship |
|---|---|---|---|
| `saeedr123/global-career-studio` | `1cf0a31` | Read and write, branch `claude/clever-thompson-rq95da` | CV builder SaaS. Live on Vercel per `PROJECT_STATUS.md` (not rechecked live in this audit). |
| `saeedr123/listing-photos-generator` | `3744c03` | Read only, shallow clone | Etsy listing image generator for spreadsheet and planner products. Separate npm workspace, separate Prisma schema, separate deployment plan. |

Answer to specification 3.2: global-career-studio is a **separate project**, not inside listing-photos-generator. They share no code or dependencies. listing-photos-generator borrows only process patterns from Global Career Studio (repository rule, auth split pattern, admin versioning), per its README line 68 and `docs/architecture.md` section 12.

### B.2 Test results run in this session

| Repository | Suite | Result |
|---|---|---|
| global-career-studio | `npm run test:web` (19 suites, includes template engine 64 export tests) | **356 passed, 0 failed** |
| global-career-studio | `npm run typecheck --workspace=global-career-studio-web` | **Pass** |
| global-career-studio | lint, build, Prisma validate | **Not run** in M0 |
| listing-photos-generator | root vitest | **43 passed** |
| listing-photos-generator | `tests/run-tests.sh` (engine suite) | **51 passed, 0 failed** |
| listing-photos-generator | ai, billing, billing-provider node suites | **39, 34, 9 passed** |
| listing-photos-generator | auth, builder (3 files), admin package tests | **13, 17, 7 passed** |
| listing-photos-generator | `tests/real-pack.test.mjs` | **0 run, skipped**: the source renders it needs are not in the repository |
| listing-photos-generator | typecheck, lint, build, Prisma validate | **Not run** in M0 |

Total counted for listing-photos-generator: 213 passed, 0 failed. Its `PROJECT_STATUS.md` records 223 on 2026-11-11. I did not reconcile the difference of 10. The likely causes are the skipped real-pack suite and a different counting method, but that is an inference, not a verified fact.

### B.3 Fidelity probe on the existing CV engine

Using the existing engine's own test output (`sidebar-long`):

| Check | Result | Meaning |
|---|---|---|
| PDF page size | A4, 595.28 x 841.89 pt, 3 pages | Correct size |
| PDF fonts | Helvetica and Helvetica-Bold, Type 1, WinAnsi, **not embedded** | Fails specification 2.1 B (embedded fonts). WinAnsi covers German umlauts and ß but not Czech or Polish characters such as ř or ł. |
| PDF to PNG, `pdftoppm -r 300` | 2481 x 3508 px, 300 DPI, about 0.8 s per page | The PNG pipeline works with Poppler 24.02.0 |
| Same CV as DOCX, rendered by LibreOffice 24.2.7.2 | **4 pages instead of 3**. Page 1 shows only the contact line; the name and headline in the navy band were not visible; the body moved to page 2. | The current PDF and DOCX adapters are two independent interpretations, which is exactly what specification 2.2 forbids. |
| Margins | PDF 48 pt, DOCX 720 twips = 36 pt | Different by design accident |
| Sidebar width | PDF 150 pt fixed, DOCX 30 percent of table | Different |
| Text | Summary prints "SAMPLE: SAMPLE:" | Minor existing bug: prefix added twice for sample data |

Note: LibreOffice is not Microsoft Word. It is the only DOCX renderer available for automated testing on Linux. A Word check needs a human with Word.

---

## Part C: Report sections requested in specification section 25

### 1. Existing repository architecture

**global-career-studio**
- npm workspaces: `apps/web` (Next.js 14.2, React 18.3.1, Tailwind 3, TypeScript 5.5) and `packages/template-engine`.
- Node 22.23.4 and npm 10.9.9 in this container.
- `apps/web/lib/*-core.mjs`: plain ES module business logic (builder, auth, billing, packs, writer, LinkedIn import, database, admin, rate limit, error format) with node script tests in `apps/web/scripts/test-*.mjs`.
- Prisma schema with 34 models (User, Profile and 6 profile child tables, Document, DocumentSection, DocumentVersion, DocumentExport, Template, TemplateVersion, CountryPack, LanguagePack, Plan, Subscription, Trial, AI ledgers, audit and system logs, FeatureFlag and others). Neon Postgres, Frankfurt, per `PROJECT_STATUS.md`.
- 4 GitHub workflows for Prisma validation and Neon migration deploy.

**listing-photos-generator**
- npm workspaces: `apps/web` (Next.js 14.2) plus 10 packages: admin, ai, auth, billing, builder, export, mockup-engine, rendering, shared, template-engine.
- Packages are TypeScript sources imported directly with `.ts` paths (Node 22 strip types).
- Prisma schema with 45 models, three migrations generated, not applied to any database per its status file.
- Export rasteriser is Python with Pillow (`packages/export/src/rasterize.py`).

### 2. Existing mockup engine assessment (listing-photos-generator)

| Capability | Status |
|---|---|
| 5 own-built SVG frames, 3000 x 2000 (phone 2000 x 3000), licence records per frame | Exists, licence-clean ("own-built, owned outright") |
| JSON registry per mockup with screen areas in a 0 to 1000 grid, allowed orientations, niche packs, version, previousVersion | Exists |
| `containFit`: centred, no stretch, no crop without approval, orientation warnings | Exists and tested. Directly reusable for 3D screen textures. |
| `licenceGate`, `validateAddFlow`, rollback helper | Exists |
| `checkPremium` | Declared booleans only, not a visual check. Labels are misleading (conflict C6). |
| 3D, GLB, WebGL, cameras, lighting, HDRI | **None** |
| Real CV content in mockups | **None**. The rasteriser draws a schematic sheet from tab names. |

Reuse value: the fit maths, licence gate, versioning pattern, ICC verification and the 5 SVG frames as 2D fallbacks. The renderer itself is not a basis for 3D work.

### 3. Existing document generation assessment (global-career-studio)

| Area | Finding |
|---|---|
| Templates | 10 definitions in `templates.ts` as data plus per-template branches inside `pdf.ts` and `docx.ts` |
| Layout model | None shared. `render.ts` builds a list of text sections; each adapter decides positions, margins, columns and pagination on its own |
| PDF | PDFKit 0.17.1, selectable text, standard fonts not embedded, flow pagination by PDFKit |
| DOCX | `docx` 9.1.1, genuine paragraphs, headings, bullets and a real table for two-column layouts. Fonts not specified for body text, header band uses paragraph shading |
| PNG | **Not implemented** in the export route (`apps/web/app/api/export/route.ts` handles PDF and DOCX only). Schema enum already includes `png` and `jpeg`. |
| Photo | Placeholder box only; no real photo rendering |
| Section titles | English defaults in `render.ts`, overridable per template; German labels exist in country packs (`packs-core.mjs`). German end-to-end export not verified in this audit. |
| Data model | `CandidateProfile`: flat strings (period as free text, city only). No website, LinkedIn, address, certifications, projects or achievements fields in the engine type, although the Prisma profile tables have some of them |
| Tests | 64 export tests check existence, text extraction, page count lower bounds, headings, tables. No visual comparison, no font embedding check, no PDF and DOCX consistency check |

Verdict: a good, honest foundation for editable DOCX and selectable PDF, but it does not meet specification 2.2 to 2.4 (single source of truth, consistency, determinism). M1 must add the canonical layout layer, not patch the adapters.

### 4. Existing export capabilities

- global-career-studio: PDF and DOCX download through `/api/export`; letters through `/api/letter-export`; import of PDF and DOCX through `file-import.ts`.
- listing-photos-generator: Etsy pack export with reconciliation gate, crisp quality gate, Python JPG rasterising, sRGB ICC profile embedded and verified from file bytes, text pack, manifest, atomic temp-directory write so a failed export never replaces a good one. This atomic and verified pattern should be copied for M7.

### 5. CV Builder integration opportunities

- The Mockup Studio should consume only a rendered page interface: `{ designId, templateVersion, pages: [{ index, pngUrl, widthPx, heightPx, paper, orientation }], contentHash }`. It never reads CV data. This keeps both products independent (specification 1.2, 15.2).
- The same interface accepts uploaded PNG, JPG or PDF from a seller who does not use the CV Builder (M4).
- Existing `DocumentExport` rows can record the PNG pages the Mockup Studio receives.

### 6. Five reference-based template design specifications (PROVISIONAL)

Built from the written descriptions only (Blocker B1). All values are draft, in points (pt), for A4 with US Letter derived by the layout engine. No sample names, photos, logos or wording from the references will be used.

Shared rules: base unit 4 pt; minimum body size 9 pt; no automatic text shrinking; section headings are localisation keys, not text.

| | 1 Classic Professional | 2 Editorial Executive | 3 Modern ATS | 4 Timeline Modern | 5 European Sidebar |
|---|---|---|---|---|---|
| Grid | Header full width, then sidebar 31 percent and main 69 percent, gutter 24 | Portrait panel top left, name block right, then grey sidebar 33 percent and main | Single column | Header full width, then sidebar 32 percent and main with timeline rail | Full-height navy sidebar 35 percent, white main |
| Name | 30 pt, uppercase, letter spacing 2 | 34 pt, high contrast serif proposal | 22 pt, sentence case | 26 pt | 26 pt, white on navy or dark on white (variant) |
| Separators | 0.5 pt rules, horizontal and vertical | Spacious, few rules, grey blocks | Muted grey bands behind selected headings | Vertical 1 pt rail with 6 pt circular markers per role | Colour contrast instead of rules |
| Photo | Circle, 96 pt, optional | Large rectangle, about 150 x 190 pt, optional | None by default | Circle, 88 pt, optional | Circle or square, 110 pt, optional |
| Sidebar content | Contact, skills, education | Contact, skills, languages | n/a | Contact, education, skills | Personal information, languages, qualifications |
| Main content | Summary (spans top), employment | Summary, employment, education | Summary, skills, employment, education | Summary, employment as timeline | Summary, experience, education |
| Colour | Monochrome; accent variant | Monochrome with grey sidebar | Monochrome; muted accent variant | Monochrome; accent marker variant | Navy sidebar default; monochrome variant |
| ATS classification | Design first (two columns) | Design first | Candidate for ATS friendly, **only after** extraction-order tests pass | Design first | Design first |
| DOCX mapping | Fixed-width borderless table for columns; header as table row | Table with merged portrait cell | Paragraph flow only | Table; timeline rail as left cell border plus marker glyphs (spike needed) | Table plus page-anchored background shape for full-height sidebar (spike needed) |
| Main DOCX risk | Low | Medium: large image and spacing | Low | High: timeline markers aligning after Word reflow | High: sidebar background on every page |

Variations for every family: with or without photo, monochrome or accent, A4 or US Letter, one or multiple pages. Variations are parameters of one family, not separate templates.

M1 starts with Family 1 (Classic Professional), per specification 7.3.

### 7. Recommended canonical CV design schema

Canonical unit: point (1/72 inch). Exact conversions: DOCX twips = pt x 20; PNG pixels at 300 DPI = pt x 300 / 72.

```ts
// Sketch for approval, not final code.
interface DesignSpec {
  schemaVersion: "1.0";
  familyId: string;            // "classic-professional"
  templateVersion: number;
  status: "draft" | "testing" | "approved" | "published" | "archived";
  page: {
    sizes: { A4: [595.28, 841.89]; US_LETTER: [612, 792] };
    margins: { top: number; right: number; bottom: number; left: number };
  };
  regions: Array<{
    id: "header" | "sidebar" | "main" | "footer" | string;
    columnStart: number; columnSpan: number;   // on a declared column grid
    firstPageOnly?: boolean;
    background?: ColourToken; padding: Insets;
    continueOnNextPage: "repeat-background" | "none";
  }>;
  grid: { columns: number[] /* widths in pt */; gutter: number };
  fonts: Array<{ role: "heading" | "body" | "display"; family: string;
                 files: Record<"regular" | "bold" | "italic", AssetId>;
                 docxFamily: string;              // name written into DOCX
                 profile: "compatible" | "design" }>;
  textStyles: Record<"name" | "title" | "sectionHeading" | "entryTitle" |
                     "entryMeta" | "body" | "bullet" | "label",
    { font: string; weight: number; size: number; lineHeight: number;
      letterSpacing: number; case: "none" | "upper"; colour: ColourToken;
      spaceBefore: number; spaceAfter: number }>;
  colours: { tokens: Record<ColourToken, Hex>; variants: Record<string, Partial<Record<ColourToken, Hex>>> };
  sections: Array<{ key: SectionKey; region: string; order: number;
                    headingLabelKey: string;      // localisation key
                    layout: "paragraph" | "entries" | "timeline" | "tags" | "list";
                    divider?: { weight: number; colour: ColourToken } }>;
  components: { photo?: { shape: "circle" | "rect"; size: [number, number]; region: string };
                timeline?: { railWeight: number; markerDiameter: number } };
  pagination: { keepHeadingWithNext: true; orphans: number; widows: number;
                splitEntries: "never" | "between-bullets"; bottomSlack: number };
  variants: { photo: boolean[]; colour: string[]; paper: ("A4" | "US_LETTER")[] };
  ats: { classification: "ats-friendly" | "design-first"; evidence?: string };
}
```

Structured CV data (v2) adds what specification 7.1 lists: address, website, LinkedIn, structured dates `{ year, month? }` for localised formatting, certifications, projects, achievements, additional sections, photo asset reference, document locale, and per-section visibility and order. A v1 to v2 adapter keeps existing saved profiles working.

Pipeline:

```
CV data v2 + DesignSpec + locale
  -> layout engine (measures text with the SAME font files PDFKit embeds)
  -> LayoutTree: pages > positioned boxes (text runs, rules, shapes, images)
  -> PDF adapter paints the tree exactly
  -> PNG = rasterise final PDF at 300 DPI
  -> DOCX adapter maps DesignSpec + the tree's page-break decisions to native Word structures
  -> Manifest: template version, renderer version, font file hashes, export profile, page size,
               config hash, content hash
```

### 8. DOCX, PDF and PNG generation architecture

| Format | Library | Decision |
|---|---|---|
| PDF | PDFKit 0.17.1 (already installed) | Keep. Register TTF or OTF fonts so they are embedded and subset. Paint from the LayoutTree with absolute positions, so PDFKit no longer decides layout. Alternatives rejected: HTML to PDF with headless Chromium (heavy on serverless and still a second interpretation for DOCX); react-pdf (its own layout engine, which DOCX cannot share). |
| Text measurement | PDFKit `widthOfString` with the registered fonts | Same metrics for layout and painting. No new dependency. |
| DOCX | `docx` 9.1.1 (already installed) | Keep. Exact page size and margins in twips, fixed-layout borderless tables for columns, exact spacing, explicit fonts, keep-with-next, widow control, hard page breaks only between entries where the layout engine broke. Hyphenation off in both PDF and DOCX for consistency. |
| PNG | Poppler `pdftoppm -r 300` | Reference rasteriser, pinned version, in the render worker (D4). |
| DOCX QA render | LibreOffice headless, pinned version | CI only, for automated comparison. |
| Image comparison | `pixelmatch` plus `pngjs` (new, small) or Pillow | Proposed. Final choice at M1. |
| ZIP | `adm-zip` 0.5.15 (already installed) | Reuse server side. |

Items to verify in an M1 spike before relying on them: page-anchored background shapes and floating images in `docx` 9.1.1 headers; DOCX font embedding support in `docx` 9.1.1 (I do not know whether it supports this).

### 9. Document fidelity strategy

1. One LayoutTree drives PDF and PNG, so PDF and PNG cannot disagree. Test: rasterise twice, hashes must match.
2. DOCX follows the same DesignSpec with integer twip conversions, so page size, margins, column widths and spacing are identical by construction.
3. Line breaks: with the "Compatible" font profile, the PDF embeds a metric-compatible font (for example Liberation Sans for Arial, Carlito for Calibri) and the DOCX names the Office font, so Word wraps lines at the same points. Assumption to verify per font pair in M1; licences to be verified before adding to the asset register.
4. Pagination: the layout engine keeps a bottom slack (draft 12 pt) so small renderer differences do not push a line onto a new page. One-page templates fail loudly if content does not fit; they never shrink text.
5. Automated comparison per template, per language, per paper size:
   - page count equal (hard fail),
   - text order and content equal via text extraction (hard fail),
   - word bounding boxes via `pdftotext -bbox`: PDF vs LibreOffice-rendered DOCX within a documented tolerance (draft 3 pt),
   - pixel mismatch percentage after 300 DPI rasterising (draft threshold 2 percent, to be calibrated on Family 1),
   - fonts embedded check (`pdffonts`), page size check.
6. Manual Word check list per published template, because Word cannot run in CI.
7. Determinism: fix PDF metadata dates and document ID, normalise DOCX zip timestamps, pin renderer and font versions, record hashes in the manifest. "Same output" is defined as identical raster hash plus identical normalised content hash.

### 10. English and German multilingual architecture

- Interface strings, template section labels and CV content are three separate stores. Existing `LanguagePack` (`interfaceStringsJson`, `documentStringsJson`, `isRTL`) already fits; labels move out of `render.ts` into language packs with admin versioning.
- Date formatting with `Intl.DateTimeFormat` per locale (for example "03/2021" or "März 2021"), driven by structured dates.
- Fonts must cover Latin Extended-A at minimum, so Czech and Polish are possible later without a font change. Coverage is tested per font file, not assumed.
- Text direction field is stored now; right-to-left layout is not implemented and not claimed.
- German expansion fixtures: long compound job titles, long company names (for example legal suffixes), long education names, long headings in narrow sidebars, multi-page content. All fixture data is fictional and marked as test data.
- No automatic translation of a customer's CV content without explicit approval (existing AI guardrails already require approval).

### 11. 3D rendering architecture (M2 onward, design only)

- Client-only Three.js scene in the Next.js app, loaded with `next/dynamic` and `ssr: false`, through React Three Fiber and Drei. Version pairing must match React 18 (my understanding is React Three Fiber 8 for React 18 and 9 for React 19; verify at install time).
- GLB loading through the GLTF loader, Draco or Meshopt only if needed.
- Screen: the CV page PNG becomes a texture in sRGB colour space, `flipY` false for glTF, maximum anisotropy, mipmaps. The page is composited into the screen's aspect ratio using the existing `containFit` maths, so there is never stretch or unapproved crop. Screen material is unlit or emissive so lighting does not recolour the CV; a separate thin glass layer adds reflection.
- Lighting: local HDRI file through an environment map, soft contact or accumulated shadows, optional ambient occlusion post-processing.
- Paper: procedural planes at exact A4 or Letter proportions with vertex-displaced curl, fanned pages and stacks. No external asset needed.
- Export: render to an offscreen render target at the profile size with 2x supersampling, then downscale. Maximum render size depends on the user's GPU (`MAX_RENDERBUFFER_SIZE`), so tiled rendering is the fallback. Browser canvas JPG encoding does not embed an ICC profile as far as I know, so final JPG encoding with the sRGB profile goes through a server step that reuses the listing-photos-generator ICC pattern.
- Reliability: texture disposal on scene change, WebGL context-loss handler that rebuilds the scene and retries the shot, no ZIP until every shot is verified.
- No GPU rendering on Vercel serverless.

### 12. Asset and licensing risks

| Risk | Level | Mitigation |
|---|---|---|
| Free laptop and phone models that copy real branded designs (trade dress) | High | Own-built or commissioned generic models only |
| CC BY assets require attribution; shipping a GLB to browsers is redistribution | Medium | Prefer CC0 or owned; record licence URL and verification date in `ASSET-REGISTER.md` |
| Fonts: PDF embedding and redistribution in Etsy packages differ by licence | High | OFL fonts only for embedding; Office fonts (Arial, Calibri) only referenced by name in DOCX, never shipped |
| HDRI and textures | Low to medium | CC0 sources, verified per file |
| Reference CV images contain third-party names, photos and layouts | Medium | Used only as visual reference; nothing copied (specification 4.2) |
| Existing premium labels (C6) | Medium | Relabel to basic or pending review until a human review is recorded |
| Pixabay licence | Noted | listing-photos-generator already blocks Pixabay until the licence is read |

### 13. Security and privacy considerations

Findings from this audit:
- **User-uploaded PDFs are parsed server side with `pdfjs-dist` 3.11.174 without `isEvalSupported: false`** (`packages/template-engine/src/exports/file-import.ts` line 29). Versions of pdf.js before 4.2.67 are, to my knowledge, affected by CVE-2024-4367 (arbitrary JavaScript execution through crafted fonts). Please verify against the official advisory. Recommended fix: set `isEvalSupported: false` now, upgrade in a separate approved change.
- `PROJECT_STATUS.md` states the sign-in gate is client side and `/admin` is unlinked rather than gated, while the admin API checks the role on the server. Admin pages for templates, models and licences must be server gated before they handle uploads.

Requirements for new work:
- GLB uploads: size limit, magic-byte check, validation with a glTF validator, reject external URIs and embedded scripts, admin only.
- SVG uploads: sanitise or rasterise; never serve admin-uploaded SVG inline.
- CV files and exports: private object storage, signed expiring URLs, owner checks on every read (`getDocumentForUser` pattern already exists), temporary render files deleted after the job.
- No CV data in logs, analytics or AI training without explicit consent (existing rule, kept).

### 14. Database and configuration proposal

Extend the existing global-career-studio schema; do not replace it.

| Change | Purpose |
|---|---|
| `TemplateVersion.status`: add `testing`, `approved`, `archived` (existing: draft, published, retired) | Specification 19 lifecycle. Additive migration. |
| `TemplateVersion.designSpecJson`, `rendererVersion`, `configHash` | Canonical spec storage and determinism record |
| `Asset` and `AssetLicence` | One licence record shape for fonts, GLB, HDRI, textures, images (specification 17 fields) |
| `FontFamily`, `FontFile` | Font registry with file hashes and glyph coverage |
| `MockupModel`, `MockupModelVersion` | Specification 9.2 registry fields |
| `StyleKit`, `StyleKitVersion` | Per shop, isolated |
| `ShotConfig`, `ShotSet` | Configuration-driven shots |
| `RenderJob`, `RenderOutput`, `ExportManifest` | Batch progress, retry, manifests |
| `DocumentExport`: add `pageIndex`, `contentHash`, `manifestJson` | PNG pages and traceability |

Configuration in the repository (`config/style-kits/`, `config/shot-sets/`, `config/design-specs/`) is the reviewed seed; the database holds the admin-edited, versioned runtime copy. Published versions are immutable; edits create a new version; rollback re-publishes an earlier version.

### 15. Detailed milestone implementation plan

| Milestone | Scope | Exit evidence |
|---|---|---|
| M1a Spike (2 to 3 days of agent work, estimate) | Fonts embedded in PDFKit; DOCX table and anchored background in `docx` 9.1.1; LibreOffice and Poppler comparison harness | Spike report with pass or fail per technique |
| M1b Engine | CV data v2 plus adapter, DesignSpec schema plus validator, layout engine, pagination, PDF painter, PNG via Poppler, DOCX mapper, manifest | Unit tests per module |
| M1c Family 1 | Classic Professional: photo and no photo, A4 and Letter, 1 and multi page, English and German fixtures | Full comparison suite green; previews presented for approval |
| M2 | 3D laptop scene with procedural or approved model, real CV texture, editor controls | Browser verification, screenshots |
| M3 | Model registry, admin upload, validation, publish, rollback | Upload to rollback demonstrated without code change |
| M4 | PNG, JPG, PDF inputs; multi-page; paper models | Page order and proportion tests |
| M5 | Style kits with draft `modustemplates` values; colour extraction | Isolation tests between shops |
| M6 | Shot composer, ordered grid, approval | One design produces a full ordered set |
| M7 | Batch export, ZIP, manifest, context-loss recovery | No partial ZIP under failure injection |
| M8 | Remaining 4 families and builder integration | All three formats per family pass |
| M9 | Interfaces between products, SaaS preparation without payments | Each product runs with the other disabled |

Templates 2 to 5 start only after Family 1 is approved (specification 4.3).

### 16. Testing and acceptance strategy

- Keep all 356 existing global-career-studio tests green; never delete or weaken them.
- New layers: schema validation tests, layout engine unit tests (line breaking, pagination, slack), adapter tests, cross-format comparison tests (section 9), determinism tests (double render, equal hashes), multilingual fixtures, security tests (upload validation), and later 3D tests (texture fit, aspect ratio, camera presets) in a headless browser.
- CI: add Poppler and LibreOffice with pinned versions plus the font files, so comparisons are reproducible. The current CI workflows only validate Prisma.
- Every milestone runs tests, typecheck, lint, build and Prisma validate, and reports any command not run.

### 17. Technical complexity and blockers

| Item | Complexity | Why |
|---|---|---|
| Own layout and pagination engine | High | Line breaking, keep rules, multi-region pages; the core of the platform |
| DOCX closeness for sidebars and timelines | High | Word reflows independently; background panels on every page are fragile |
| Font strategy across PDF, Word, LibreOffice, Etsy buyers | Medium to high | Licences and metric compatibility |
| PNG on serverless | Medium | Native tool or render worker needed (D4) |
| 3D realism | Medium to high | Depends on asset quality (D5) |
| Batch export in browser | Medium | GPU limits, memory, context loss |
| Admin, versioning, registries | Medium | Patterns already exist in both repositories |

Blockers: B1 to B4 in Part A.

---

## What I could not verify

- The five reference images (not supplied).
- The live Vercel deployment and Neon database state (not rechecked; taken from `PROJECT_STATUS.md`).
- The 223 test count in listing-photos-generator (213 counted here, difference not reconciled).
- Lint, build and Prisma validation in either repository (not run in M0).
- Microsoft Word rendering of any DOCX.
- The exact CVE scope for pdf.js 3.11.174, React Three Fiber version pairing, and `docx` 9.1.1 support for anchored shapes and font embedding.

## Files changed in M0

- `docs/m0-cv-commerce-platform-audit.md` (this report). No code, configuration, schema or test changed.
