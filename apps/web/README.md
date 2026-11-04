# Global Career Studio web app (dashboard shell)

Status: Phase 2 increment 2 dashboard shell only. This is NOT a finished
product. There are no accounts, payments, AI features, document editing,
letters, ATS analysis, or country packs in this shell.

## What is in this increment

- Design tokens in `lib/design-tokens.ts`, `app/globals.css`, and
  `tailwind.config.js`: colours, fonts, spacing, and radii in one place.
- Edition aware header in `app/components/EditionHeader.tsx`, selected by
  configuration in `lib/config.ts`, not by hard coded copy.
- Home page at `app/page.tsx` and dashboard shell at `app/dashboard/page.tsx`.
  The dashboard has placeholder cards only for profile, saved documents,
  templates, AI credits, subscription, and human review. Each card says
  it is a placeholder, so it is never mistaken for a working feature.
- Combined now, split later design: one application now, with separate
  skins and copy per edition, modular auth planned, an edition tag in the
  database, separate billing products per edition planned, and separate
  entry points. See docs/architecture.md for the full split ready rules.

## Edition selection

Set the edition at build time:

```
NEXT_PUBLIC_EDITION=nvconsult npm run build
```

Use `nvconsult` for the NVConsult edition, or `commercial` (the default)
for the commercial Global Career Studio edition. The edition changes
branding, header copy, and help links only. It does not change the
template engine, the documents, or the free tier.

The tools site domain is on hold as of 4 November 2026. Use placeholder
domain configuration only. Do not check domain availability and do not
purchase anything.

## Run locally

From this folder:

```
npm install
npm run dev
```

If `npm install` fails in this workspace with a chown EPERM error on a
package binary, retry with `npm install --no-bin-links`. The npm scripts
already call Next.js and TypeScript by their file paths, so they work
with either install style. Next.js is pinned to a patched 14.2.x release
after an earlier 14.2.18 install warned about a security vulnerability.

Then open the local address shown by Next.js.

## Build and typecheck

```
npm run build
npm run typecheck
```

In increment 2, the production build passed for both editions: route `/`
and route `/dashboard`, each 142 B, 87.4 kB first load JS. The dashboard
layout is one column on phones, two columns on tablets, and three
columns on desktops.

## Structure

- `app/layout.tsx`: shared layout with the edition aware header.
- `app/page.tsx`: home page.
- `app/dashboard/page.tsx`: dashboard shell, placeholders only.
- `app/components/EditionHeader.tsx` and `app/components/PlaceholderCard.tsx`.
- `app/globals.css`, `tailwind.config.js`, `postcss.config.js`: styling setup.
- `lib/config.ts`: edition configuration and placeholder flags only.
  Values there are NOT prices, trial offers, or limits. Real values come
  from admin configuration in later phases.
- `lib/design-tokens.ts`: design tokens.

## Extend

Add real features only in the order in PROJECT_STATUS.md, and only after
the open decisions (price, Stripe, AI provider, domain on hold, hosting,
legal) are recorded. Do not hard code copy, prices, or limits in UI
components. Put configurable copy and limits behind configuration or
admin data.
