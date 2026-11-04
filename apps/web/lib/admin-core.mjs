// Admin logic, Phase 2 increment 10, local only.
// Pure JavaScript, no browser or database dependency, so the same
// logic can be tested with plain Node and used by the admin page.
// This is NOT a secured production admin. No real database and no
// real admin auth are connected in this increment, so the admin page
// is local only and must say so plainly. Nothing in this module
// reads, stores, or returns CV text, user names, emails, document
// content, passwords, tokens, or secrets. Aggregated counts read
// only template id, country pack id, and plan id fields. Audit
// entries record action, time, and reason only, plus a short plain
// summary that is sanitised before it is stored.

export const FEATURE_FLAG_KEYS = ["writer", "letters", "ats", "packs", "onboarding"];

export const CONFIG_KINDS = ["templates", "prompts", "countryPacks"];

export function createFeatureFlags() {
  return {
    writer: true,
    letters: true,
    ats: true,
    packs: true,
    onboarding: true
  };
}

export function setFeatureFlag(flags, key, enabled, reason) {
  if (!FEATURE_FLAG_KEYS.includes(key)) {
    throw new Error(`Unknown feature flag: ${key}.`);
  }
  if (!reason || !String(reason).trim()) {
    throw new Error("A reason is required to change a feature flag.");
  }
  return { ...(flags || createFeatureFlags()), [key]: Boolean(enabled) };
}

export function createVersionedConfig() {
  return {
    templates: { published: null, preview: null, history: [] },
    prompts: { published: null, preview: null, history: [] },
    countryPacks: { published: null, preview: null, history: [] }
  };
}

function requireConfigKind(kind) {
  if (!CONFIG_KINDS.includes(kind)) {
    throw new Error(`Unknown config kind: ${kind}.`);
  }
}

function requireReason(reason) {
  if (!reason || !String(reason).trim()) {
    throw new Error("A reason is required for this admin action.");
  }
  return String(reason).trim();
}

function cloneStore(store) {
  return JSON.parse(JSON.stringify(store || createVersionedConfig()));
}

export function previewConfig(store, kind, version, summary, reason) {
  requireConfigKind(kind);
  requireReason(reason);
  if (!version || !String(version).trim()) {
    throw new Error("A version label is required to preview a config.");
  }
  const next = cloneStore(store);
  next[kind].preview = { version: String(version).trim(), summary: String(summary || "") };
  return next;
}

export function publishConfig(store, kind, version, summary, reason) {
  requireConfigKind(kind);
  requireReason(reason);
  if (!version || !String(version).trim()) {
    throw new Error("A version label is required to publish a config.");
  }
  const next = cloneStore(store);
  const current = next[kind];
  if (current.published) {
    current.history = [...current.history, current.published];
  }
  current.published = { version: String(version).trim(), summary: String(summary || "") };
  current.preview = null;
  return next;
}

export function rollbackConfig(store, kind, reason) {
  requireConfigKind(kind);
  requireReason(reason);
  const next = cloneStore(store);
  const current = next[kind];
  if (!current.history || current.history.length === 0) {
    throw new Error(`No earlier published version exists for ${kind}, so rollback is not possible.`);
  }
  // The most recent earlier published version becomes published
  // again, and the version being rolled back from is replaced, not
  // kept in history. A second rollback therefore throws unless a
  // new version was published in between.
  const previous = current.history[current.history.length - 1];
  current.history = current.history.slice(0, -1);
  current.published = previous;
  current.preview = null;
  return next;
}

export function aggregateCounts(documents, planId) {
  const byTemplate = {};
  const byCountryPack = {};
  const list = Array.isArray(documents) ? documents : [];
  for (const doc of list) {
    const settings = (doc && doc.settings) || {};
    const templateId = settings.templateId ? String(settings.templateId) : "unknown";
    const packId = settings.countryPackId ? String(settings.countryPackId) : "not recorded";
    byTemplate[templateId] = (byTemplate[templateId] || 0) + 1;
    byCountryPack[packId] = (byCountryPack[packId] || 0) + 1;
  }
  const byPlan = {};
  if (planId) {
    byPlan[String(planId)] = list.length;
  } else {
    byPlan["not recorded"] = list.length;
  }
  return { total: list.length, byTemplate, byCountryPack, byPlan };
}

export function sanitiseAuditText(text) {
  let clean = String(text || "");
  clean = clean.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[removed]");
  clean = clean.replace(/(password|token|secret|apiKey|api_key)\s*[:=]\s*\S+/gi, "$1 [removed]");
  return clean;
}

export function createAuditLog() {
  return [];
}

export function appendAuditLog(log, action, reason, summary, nowIso) {
  if (!action || !String(action).trim()) {
    throw new Error("An audit action name is required.");
  }
  if (!reason || !String(reason).trim()) {
    throw new Error("A reason is required for an audit log entry.");
  }
  const entry = {
    action: String(action).trim(),
    time: nowIso || new Date().toISOString(),
    reason: sanitiseAuditText(String(reason).trim()),
    summary: sanitiseAuditText(String(summary || ""))
  };
  return [...(log || []), entry];
}
