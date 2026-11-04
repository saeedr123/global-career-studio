// AI provider abstraction, Phase 2 increment 11.
// Selected provider: Muse AI, as decided by the owner. Connected Muse AI
// is ready for a key and is NOT live until the owner adds a key and sets
// a budget cap. Until both are set, the writer falls back to the existing
// local rule based writer, and no user CV text is sent anywhere.
// Configuration comes only from environment variables, never from code,
// never from a test, and never from a log. The API key itself is never
// returned by any function in this module, never stored, and never
// included in any output or log line. Only the variable name is named
// in docs and UI copy: GCS_AI_API_KEY.
// Guardrails are unchanged from the local writer: never invent
// qualifications, employers, job titles, dates, certifications, or
// achievements; missing fields are prompts; a suggestion is applied
// only after user confirmation (see lib/writer-core.mjs).

export const AI_PROVIDER_NAME = "Muse AI";
export const AI_PROVIDER_ENV_VAR = "GCS_AI_PROVIDER";
export const AI_MODEL_ENV_VAR = "GCS_AI_MODEL";
export const AI_KEY_ENV_VAR = "GCS_AI_API_KEY";
export const AI_BUDGET_CAP_ENV_VAR = "GCS_AI_BUDGET_CAP";

function readEnv(env, name) {
  if (env && typeof env[name] === "string") {
    return env[name];
  }
  return "";
}

function nonEmpty(value) {
  return Boolean(value && String(value).trim());
}

// Returns a safe status object only. It never contains the key, the
// model key value, or any secret style value, even when a key is set.
export function getAiProviderStatus(env) {
  const source = env || {};
  const providerRaw = readEnv(source, AI_PROVIDER_ENV_VAR);
  const provider = nonEmpty(providerRaw) ? String(providerRaw).trim() : AI_PROVIDER_NAME;
  const modelRaw = readEnv(source, AI_MODEL_ENV_VAR);
  const modelConfigured = nonEmpty(modelRaw);
  const hasKey = nonEmpty(readEnv(source, AI_KEY_ENV_VAR));
  const budgetCapRaw = readEnv(source, AI_BUDGET_CAP_ENV_VAR);
  const budgetCapSet = nonEmpty(budgetCapRaw);
  const live = hasKey && budgetCapSet && provider === AI_PROVIDER_NAME;
  return {
    provider,
    providerSelected: provider,
    modelConfigured,
    modelNameSet: modelConfigured,
    hasKey,
    keyConfigured: hasKey,
    budgetCapSet,
    live,
    liveReady: live,
    mode: live ? "connected" : "local-fallback",
    statusText: live
      ? "Connected Muse AI is live, within the owner set budget cap."
      : "Connected Muse AI is ready for a key and is NOT live until the owner adds a key and sets a budget cap. Local writer is used until then.",
    fallbackNote: "When no key is configured, or no budget cap is set, the local rule based writer runs instead, and no user CV text is sent anywhere."
  };
}

// Selects the writer mode from a safe status object. Connected mode is
// returned only when the status says live, which requires both a key
// and a budget cap. Every other case falls back to local.
export function selectWriterMode(status) {
  const s = status || {};
  if (s.live === true && s.providerSelected === AI_PROVIDER_NAME) {
    return "connected";
  }
  return "local";
}

// Sanitises a string for logging or display. If a key value is passed
// in as knownSecret, every occurrence is replaced. Key like patterns
// are also replaced, so a leaked value cannot pass through a log line
// by accident. This function never returns the key.
export function redactSecrets(text, knownSecret) {
  let out = String(text || "");
  if (knownSecret && String(knownSecret).length >= 8) {
    out = out.split(String(knownSecret)).join("[REDACTED]");
  }
  out = out.replace(/GCS_AI_API_KEY\s*=\s*\S+/g, "GCS_AI_API_KEY=[REDACTED]");
  out = out.replace(/(api[_-]?key|apikey|secret|token)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
  return out;
}

// Connected rewrite request, deliberately not a live call in this
// increment. When not live, it returns a fallback result and sends
// nothing. When live, a future increment must add the real call here,
// behind the same guardrails, and must still require user confirmation
// before any suggestion is applied. This function never returns a key.
export function requestConnectedRewrite(status, userText) {
  const mode = selectWriterMode(status);
  if (mode !== "connected") {
    return {
      live: false,
      mode: "local-fallback",
      sent: false,
      suggested: "",
      note: "Connected Muse AI is NOT live: no key or no budget cap is configured, so nothing was sent. Use the local writer instead."
    };
  }
  return {
    live: true,
    mode: "connected",
    sent: false,
    suggested: "",
    note: "Connected mode is selected in config, but no live call is made by this helper in increment 11. A live call must be added in a later increment, behind the same guardrails, before this path sends any user text."
  };
}
