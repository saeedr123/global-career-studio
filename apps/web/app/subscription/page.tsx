"use client";

import { useEffect, useState } from "react";
import {
  BILLING_NOT_FINAL_NOTE,
  DOWNGRADE_BEHAVIOUR,
  PLANS,
  PRICE_NOTE,
  TRIAL_CONFIG,
  applyTrialExpiry,
  cancelLocalSubscription,
  canViewDocument,
  createSubscriptionState,
  downgradeToFree,
  effectivePlan,
  getEntitlements,
  startTrial
} from "../../lib/billing-core.mjs";
import RequireAuth from "../components/RequireAuth";

// Subscription page, Phase 2 increment 9, placeholder billing only.
// No checkout, no payment form, and no Stripe integration is working
// here. The plan shown is local browser state only, until a real
// database and Stripe are connected. Cancel only cancels the local
// trial or premium flag. It never charges and never contacts a
// payment provider. Price, currency, and Stripe product ids are not
// set, and no price is invented on this page.

const SUBSCRIPTION_KEY = "gcs-subscription";

function formatPrice(plan: any) {
  if (plan.price === null || plan.price === undefined) {
    return "Not set yet";
  }
  return String(plan.price);
}

export default function SubscriptionPage() {
  const [state, setState] = useState<any>(() => createSubscriptionState("free"));
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SUBSCRIPTION_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        setState(applyTrialExpiry(stored));
      }
    } catch {
      // An unreadable subscription is ignored, the plan stays Free.
    }
  }, []);

  function persist(next: any, note: string) {
    setState(next);
    try {
      window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(next));
    } catch {
      setMessage("Local plan could not be saved in this browser.");
      return;
    }
    setMessage(note);
  }

  function handleStartTrial() {
    try {
      const next = startTrial(state);
      persist(next, `Local trial started. Trial ends ${next.trialEnd}. No card was taken, no charge was made, and no payment provider was contacted.`);
    } catch (error: any) {
      setMessage(error?.message || "Local trial could not be started.");
    }
  }

  function handleCancel() {
    const next = cancelLocalSubscription(state);
    persist(next, next.cancelNote || "Local plan cancelled.");
  }

  function handleDowngradeNow() {
    const next = downgradeToFree(state);
    persist(next, "Moved to Free now, locally. You can still view and download documents you already created.");
  }

  const currentPlanId = effectivePlan(state);
  const entitlements = getEntitlements(currentPlanId);
  const trialActive = state.plan === "trial" && currentPlanId === "trial";
  const viewKept = canViewDocument();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <RequireAuth>
      <p className="eyebrow">Subscription</p>
      <h1 className="page-title">Subscription</h1>
      <p className="mt-3 text-ink">
        This page shows your plan only. No checkout, no payment form, and no Stripe integration is working here. No payment is taken in this app.
      </p>
      <p className="mt-3 notice text-ink">{BILLING_NOT_FINAL_NOTE} {PRICE_NOTE}</p>

      <section className="mt-6 card">
        <h2 className="font-semibold">Current plan</h2>
        <p className="mt-2 text-ink">Plan: {currentPlanId === "trial" ? "Trial" : currentPlanId === "premium" ? "Premium" : "Free"}</p>
        <p className="mt-1 text-ink">Price: {formatPrice(entitlements)} {entitlements.currency ? entitlements.currency : ""}</p>
        {state.plan === "trial" && (
          <div className="mt-2 text-ink">
            <p>Trial status: {trialActive ? "Active" : "Ended"}</p>
            <p>Trial started: {state.trialStart || "Not set"}</p>
            <p>Trial ends: {state.trialEnd || "Not set"}</p>
            {state.cancelled && <p>Local trial cancelled. Access until: {state.accessUntil || "trial end date above"}</p>}
            <p className="mt-2">Downgrade notice: after the trial ends, you move to Free automatically. Premium editing, premium templates, and premium exports lock, and you can still view and download documents you already created.</p>
          </div>
        )}
        {state.plan === "premium" && state.cancelled && (
          <p className="mt-2 text-ink">Local premium flag cancelled. Access until: {state.accessUntil || "end of the current period, not set locally"}. No charge was made and no payment provider was contacted.</p>
        )}
        <p className="mt-2 text-ink">Trials used on this account: {state.trialCount || 0} of {TRIAL_CONFIG.perAccountLimit}. Trial length: {TRIAL_CONFIG.lengthDays} days. Card required for trial: {TRIAL_CONFIG.cardRequired ? "Yes" : "No"}.</p>
      </section>

      <section className="mt-6 card">
        <h2 className="font-semibold">Your entitlements, local plan</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
          <li>Templates allowed: {entitlements.templatesAllowed === "all" ? "All 10 version 1 templates" : entitlements.templatesAllowed.join(", ")}</li>
          <li>Document limit: {entitlements.documentLimit === null ? "No cap set in this config" : entitlements.documentLimit}</li>
          <li>AI access: {entitlements.aiAccess === "advanced" ? "Advanced, in config only, no connected AI provider is built yet" : "Basic local rewriting only"}</li>
          <li>Letter access: {entitlements.letterAccess === "full" ? "Full, all letter types" : "Basic, cover letters only"}</li>
          <li>Export formats: {entitlements.exportFormats.join(", ")}</li>
          <li>Advanced customisation: {entitlements.advancedCustomisation ? "Included" : "Not included"}</li>
          <li>Document bundles: {entitlements.bundleAccess ? "Included" : "Not included"}</li>
        </ul>
      </section>

      <section className="mt-6 card">
        <h2 className="font-semibold">What happens when you downgrade</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
          <li>You keep viewing your documents: {DOWNGRADE_BEHAVIOUR.keepView ? "yes" : "no"}</li>
          <li>You keep downloading documents you already created: {DOWNGRADE_BEHAVIOUR.keepDownload ? "yes" : "no"}</li>
          <li>Premium editing locks: {DOWNGRADE_BEHAVIOUR.lockPremiumEditing ? "yes" : "no"}</li>
          <li>Premium templates lock for new documents: {DOWNGRADE_BEHAVIOUR.lockPremiumTemplates ? "yes" : "no"}</li>
          <li>Premium exports lock for new exports: {DOWNGRADE_BEHAVIOUR.lockPremiumExports ? "yes" : "no"}</li>
          <li>{DOWNGRADE_BEHAVIOUR.note}</li>
          <li>{viewKept.reason}</li>
        </ul>
      </section>

      <section className="mt-6 card">
        <h2 className="font-semibold">Plans, price not set</h2>
        <ul className="mt-2 space-y-3">
          {PLANS.map((plan: any) => (
            <li key={plan.id} className="card">
              <p className="font-semibold">{plan.name}: price {formatPrice(plan)}</p>
              <p className="text-sm text-muted">Templates: {plan.templatesAllowed === "all" ? "All" : plan.templatesAllowed.join(", ")} | Exports: {plan.exportFormats.join(", ")} | Letters: {plan.letterAccess} | AI: {plan.aiAccess}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">The same free tier applies to everyone, in both editions. NVConsult adds human help, not a second public price list.</p>
      </section>

      <section className="mt-6 card">
        <h2 className="font-semibold">Local actions only</h2>
        <p className="mt-2 text-sm text-ink">These buttons only change the local plan flag in this browser. They never charge, never open a checkout, and never contact a payment provider.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={handleStartTrial}>Start local trial</button>
          <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel local trial or premium</button>
          <button type="button" className="btn-secondary" onClick={handleDowngradeNow}>Move to Free now, locally</button>
        </div>
        <p className="mt-3 text-sm text-ink">Cancel note: cancelling locally keeps trial access until the trial end date shown above, where a trial end exists, then you move to Free. In real billing, the same end of period access rule will apply, with the exact dates shown before launch.</p>
      </section>

      {message && <p className="mt-4 card">{message}</p>}
      <p className="mt-4"><a className="brand-link" href="/dashboard">Back to the dashboard</a> | <a className="ml-2 brand-link" href="/builder">Back to the builder</a></p>
      </RequireAuth>
    </main>
  );
}
