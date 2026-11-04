// Billing configuration and entitlement logic, Phase 2 increment 9.
// Configuration only. No payment provider is connected, no checkout
// is shown, and no charge is made anywhere in this increment.
// Price, currency, and Stripe product ids are decided later by the
// owner. They are null here on purpose, never invented prices.
// Entitlements are local browser state only in this increment,
// clearly labelled, until a real database and Stripe are connected.
// The same free tier applies to everyone, in both editions. NVConsult
// adds human help, not a second public price list. Separate billing
// products per edition are planned for a later split, but no product
// id is set here, so no edition has a different price in this config.
// PNG export is not listed as an allowed format, because no PNG
// export route is built in this increment. It must not be promised
// until it is built and tested.

export const PRICE_NOTE =
  "Price, currency, and Stripe product ids are decided later by the owner. No price is shown in this app until the owner sets one.";

export const BILLING_NOT_FINAL_NOTE =
  "Billing, VAT, invoices, and the refund policy are not final and will be published before launch. No payment is taken in this app.";

export const TRIAL_CONFIG = {
  lengthDays: 7,
  cardRequired: false,
  perAccountLimit: 1,
  aiCreditAllowance: null,
  exportAllowance: null
};

export const DOWNGRADE_BEHAVIOUR = {
  keepView: true,
  keepDownload: true,
  lockPremiumEditing: true,
  lockPremiumTemplates: true,
  lockPremiumExports: true,
  neverLockViewingOwnCv: true,
  note: "After a trial or premium period ends, you move to Free. Premium editing, premium templates, and premium exports lock until you subscribe. You can still view and download documents you already created. You are never locked out of viewing your own CV."
};

const FREE_TEMPLATES = ["ats-minimal", "modern-professional", "european"];

export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: null,
    currency: null,
    stripeProductId: null,
    stripePriceId: null,
    templatesAllowed: [...FREE_TEMPLATES],
    documentLimit: 2,
    aiAccess: "basic",
    aiCreditAllowance: null,
    letterAccess: "basic",
    letterTypesAllowed: ["cover"],
    exportFormats: ["pdf"],
    advancedCustomisation: false,
    bundleAccess: false
  },
  {
    id: "premium",
    name: "Premium",
    price: null,
    currency: null,
    stripeProductId: null,
    stripePriceId: null,
    templatesAllowed: "all",
    documentLimit: null,
    aiAccess: "advanced",
    aiCreditAllowance: null,
    letterAccess: "full",
    letterTypesAllowed: "all",
    exportFormats: ["pdf", "docx"],
    advancedCustomisation: true,
    bundleAccess: true
  },
  {
    id: "trial",
    name: "Trial",
    price: null,
    currency: null,
    stripeProductId: null,
    stripePriceId: null,
    templatesAllowed: "all",
    documentLimit: null,
    aiAccess: "advanced",
    aiCreditAllowance: TRIAL_CONFIG.aiCreditAllowance,
    letterAccess: "full",
    letterTypesAllowed: "all",
    exportFormats: ["pdf", "docx"],
    advancedCustomisation: true,
    bundleAccess: true,
    trialLengthDays: TRIAL_CONFIG.lengthDays,
    trialCardRequired: TRIAL_CONFIG.cardRequired,
    trialPerAccountLimit: TRIAL_CONFIG.perAccountLimit
  }
];

export function planById(id) {
  return PLANS.find((plan) => plan.id === id) || PLANS[0];
}

export function getEntitlements(planId) {
  return JSON.parse(JSON.stringify(planById(planId)));
}

function listAllows(list, value) {
  if (list === "all") {
    return true;
  }
  return (list || []).includes(value);
}

export function isTemplateAllowed(planId, templateId) {
  return listAllows(planById(planId).templatesAllowed, templateId);
}

export function isLetterTypeAllowed(planId, letterTypeId) {
  return listAllows(planById(planId).letterTypesAllowed, letterTypeId);
}

export function isExportFormatAllowed(planId, format) {
  return listAllows(planById(planId).exportFormats, format);
}

export function isAdvancedAiAllowed(planId) {
  return planById(planId).aiAccess === "advanced";
}

export function isAdvancedAtsAllowed(planId) {
  return planId === "premium" || planId === "trial";
}

export function lockMessage(feature) {
  const messages = {
    template: "This template is locked on the Free plan. It is a premium template. Your documents stay viewable, and you can still use a free template for a new document.",
    exportFormat: "This export format is locked on the Free plan. Standard PDF export is included on Free. DOCX export is a premium export.",
    advancedAi: "Advanced AI features, including job specific tailoring, are locked on the Free plan. Basic local rewriting is still available on Free.",
    letter: "This letter type is locked on the Free plan. Cover letters are included on Free. Full letter types are a premium feature.",
    advancedCustomisation: "Advanced customisation is locked on the Free plan. Basic colours and fonts within the free template set are still available.",
    bundle: "Document bundles are locked on the Free plan."
  };
  return messages[feature] || "This feature is locked on the Free plan. Your documents stay viewable.";
}

// Export enforcement for a new export, and the kept download rule
// for a document that was already created. An already created
// document is always viewable and downloadable, even after a
// downgrade, so existingDocument true allows the export even when
// the template or format would otherwise be locked for a new export.
// A new export with no existing document flag follows the plan.
export function canExportDocument(input) {
  const data = input || {};
  const planId = data.planId || "free";
  if (data.existingDocument) {
    return {
      allowed: true,
      reason: "Download kept for a document you already created, even after downgrade. You are never locked out of viewing your own CV."
    };
  }
  if (!isTemplateAllowed(planId, data.templateId)) {
    return { allowed: false, reason: lockMessage("template") };
  }
  if (!isExportFormatAllowed(planId, data.format)) {
    return { allowed: false, reason: lockMessage("exportFormat") };
  }
  if (planId === "trial" && typeof TRIAL_CONFIG.exportAllowance === "number") {
    const used = typeof data.exportsUsed === "number" ? data.exportsUsed : 0;
    if (used >= TRIAL_CONFIG.exportAllowance) {
      return { allowed: false, reason: "Your trial export allowance is used up. Your documents stay viewable." };
    }
  }
  return { allowed: true, reason: "" };
}

export function canViewDocument() {
  return { allowed: true, reason: "Viewing your own document is never locked, on any plan." };
}

export function canDownloadExistingDocument() {
  return { allowed: true, reason: "Download kept for a document you already created, even after downgrade." };
}

export function canExportLetter(input) {
  const data = input || {};
  if (data.existingDocument) {
    return { allowed: true, reason: "Download kept for a letter you already created, even after downgrade." };
  }
  if (!isExportFormatAllowed(data.planId || "free", data.format)) {
    return { allowed: false, reason: lockMessage("exportFormat") };
  }
  return { allowed: true, reason: "" };
}

// Local subscription state only. This is browser state in this
// increment, not a server subscription, and it never contacts a
// payment provider.
export function createSubscriptionState(planId) {
  return {
    plan: planId === "premium" || planId === "trial" ? planId : "free",
    trialCount: 0,
    trialStart: null,
    trialEnd: null,
    trialActive: false,
    cancelled: false,
    accessUntil: null,
    aiCreditsUsed: 0,
    exportsUsed: 0
  };
}

export function trialEndDate(startIso, lengthDays) {
  const days = typeof lengthDays === "number" ? lengthDays : TRIAL_CONFIG.lengthDays;
  const start = new Date(startIso);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function isTrialActive(state, nowIso) {
  if (!state || state.plan !== "trial" || !state.trialEnd) {
    return false;
  }
  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  return new Date(state.trialEnd).getTime() > now;
}

export function canStartTrial(state) {
  const count = state && typeof state.trialCount === "number" ? state.trialCount : 0;
  return count < TRIAL_CONFIG.perAccountLimit;
}

export function startTrial(state, nowIso) {
  const current = state || createSubscriptionState("free");
  if (!canStartTrial(current)) {
    throw new Error("Only one trial is allowed per account. This account has already used its trial.");
  }
  const start = nowIso || new Date().toISOString();
  return {
    ...current,
    plan: "trial",
    trialCount: current.trialCount + 1,
    trialStart: start,
    trialEnd: trialEndDate(start, TRIAL_CONFIG.lengthDays),
    trialActive: true,
    cancelled: false,
    accessUntil: null
  };
}

export function effectivePlan(state, nowIso) {
  if (!state) {
    return "free";
  }
  if (state.plan === "trial") {
    return isTrialActive(state, nowIso) ? "trial" : "free";
  }
  return state.plan;
}

export function downgradeToFree(state) {
  const current = state || createSubscriptionState("free");
  return {
    ...current,
    plan: "free",
    trialActive: false,
    previousPlan: current.plan,
    downgradeNote: DOWNGRADE_BEHAVIOUR.note
  };
}

export function applyTrialExpiry(state, nowIso) {
  const current = state || createSubscriptionState("free");
  if (current.plan === "trial" && !isTrialActive(current, nowIso)) {
    return downgradeToFree(current);
  }
  return current;
}

// Local cancel only. It sets the cancelled flag and records access
// until the trial end date, where a trial end exists. It never
// charges, never contacts a payment provider, and it never deletes
// a document. After the access date passes, the effective plan is
// Free, and viewing and downloading already created documents stay
// available.
export function cancelLocalSubscription(state) {
  const current = state || createSubscriptionState("free");
  if (current.plan === "free") {
    return { ...current, cancelled: false, accessUntil: null, cancelNote: "You are already on Free, so there is nothing to cancel locally." };
  }
  const accessUntil = current.plan === "trial" ? current.trialEnd : null;
  return {
    ...current,
    cancelled: true,
    accessUntil,
    cancelNote: accessUntil
      ? `Local trial cancelled. You keep trial access until ${accessUntil}. No charge was made and no payment provider was contacted. After that date you move to Free, and you can still view and download documents you already created.`
      : "Local premium flag cancelled. No charge was made and no payment provider was contacted. You move to Free, and you can still view and download documents you already created."
  };
}

export function isWithinTrialAllowance(state, kind) {
  if (!state || state.plan !== "trial") {
    return true;
  }
  if (kind === "ai") {
    if (typeof TRIAL_CONFIG.aiCreditAllowance !== "number") {
      return true;
    }
    return (state.aiCreditsUsed || 0) < TRIAL_CONFIG.aiCreditAllowance;
  }
  if (kind === "export") {
    if (typeof TRIAL_CONFIG.exportAllowance !== "number") {
      return true;
    }
    return (state.exportsUsed || 0) < TRIAL_CONFIG.exportAllowance;
  }
  return true;
}
