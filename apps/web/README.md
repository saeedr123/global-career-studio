# Global Career Studio web app (scaffold)

Status: Phase 2 increment 1 scaffold only. This is NOT a finished product.
There are no accounts, payments, AI features, dashboard, letters, ATS
analysis, or country packs in this scaffold.

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

## Structure

- `app/layout.tsx` and `app/page.tsx`: the scaffold home page.
- `app/globals.css`, `tailwind.config.js`, `postcss.config.js`: styling setup.
- `lib/config.ts`: placeholder configuration only. Values there are NOT
  prices, trial offers, or limits. Real values come from admin configuration
  in later phases.

## Extend

Add real features only in the order in PROJECT_STATUS.md, and only after
the open decisions (price, Stripe, AI provider, domain, hosting, legal)
are recorded. Do not hard code copy, prices, or limits in UI components.
Put configurable copy and limits behind configuration or admin data.
