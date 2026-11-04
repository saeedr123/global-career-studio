# Owner to confirm: single list for Studio legal docs

Status: Phase 2 increment 11, repo only, not published live. This
list is the one place where every explicit owner to confirm
placeholder in docs/legal/ is collected. Nothing on this list has
been invented, and no document in docs/legal/ may be published as
final until each item on this list is confirmed by the owner and
the legal check recommended in each doc is done.

## Placeholders in the legal docs

1. Refund window in days: OWNER TO CONFIRM. Appears in
   docs/legal/refund-policy.md and
   docs/legal/trial-and-billing-disclosure.md. No number of days
   is stated anywhere in the legal docs.
2. Human review turnaround: OWNER TO CONFIRM. Appears in
   docs/legal/terms-of-service.md, docs/legal/refund-policy.md,
   docs/legal/trial-and-billing-disclosure.md, and
   docs/human-review-scope.md. No turnaround time is stated.
3. Human review price: OWNER TO CONFIRM. Appears in the same docs
   as item 2. No price is stated. Free resume review and free
   LinkedIn review remain free extras, and are not affected.
4. Price for each plan, and currency: OWNER TO CONFIRM. Prices
   stay null placeholders in the billing config.
5. Stripe product and price ids: OWNER TO CONFIRM. Stripe is on
   hold, and no Stripe integration work beyond the existing null
   placeholder config is done in increment 11.
6. VAT treatment and invoicing: OWNER TO CONFIRM.
7. Billing period, renewal, and cancel terms for paid plans:
   OWNER TO CONFIRM.
8. Refund method, fee, and timing, once paid plans are enabled:
   OWNER TO CONFIRM.
9. Hosting provider and data location for GDPR purposes:
   OWNER TO CONFIRM. See docs/deployment-preparation.md, section 10.
10. Backup expiry statement for account deletion: OWNER TO CONFIRM.
11. Muse AI key: OWNER TO CONFIRM, added only as an environment
    variable, never in the repo. Variable name only:
    GCS_AI_API_KEY. Model name is configurable through
    GCS_AI_MODEL. No budget cap has been set yet: OWNER TO
    CONFIRM, through GCS_AI_BUDGET_CAP, before any live call.
12. Legal check before live publication on nvconsult.eu: still
    required for privacy, terms, refund, and trial and billing
    disclosure, even after items 1 to 11 are confirmed.

## What is already fixed, not a placeholder

- Operator: NVConsult is the trade name of Saeed Rasul, a
  self-employed tradesperson (Czech OSVC), ICO 23038594, Brno,
  Czech Republic, contact info@nvconsult.eu. NVConsult is the
  trade name, not a registered company.
- Free tier same for everyone, trial 7 days, no card, one trial
  per account, downgrade keeps view and download, never lock
  viewing own CV.
- No training on user CVs without separate explicit consent.
- Account deletion includes photos, exports, and AI logs.
- Admin access logged for support with recorded reason only.
- Analytics without CV content.
- No guaranteed ATS outcome, letters and writer output must be
  checked by the user before use.
- Stripe payments on hold, no payments taken yet, prices not set,
  refund policy takes effect only when paid plans are enabled.
