// AI provider tests, Phase 2 increment 11. Run with plain Node:
//   node scripts/test-ai-provider.mjs
// Tests provider selection, fallback to the local writer with no key,
// guardrails unchanged, and no key leakage into output or logs.
// No real key is used anywhere in this file, no live call is made,
// and no user CV text is sent anywhere.

import assert from "node:assert";
import {
  AI_PROVIDER_NAME,
  getAiProviderStatus,
  redactSecrets,
  requestConnectedRewrite,
  selectWriterMode
} from "../lib/ai-provider-core.mjs";
import { applyRewrite, suggestSummaryRewrite } from "../lib/writer-core.mjs";

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

check("provider defaults to Muse AI when no provider env var is set", () => {
  const status = getAiProviderStatus({});
  assert.equal(status.provider, "Muse AI");
  assert.equal(status.providerSelected, "Muse AI");
  assert.equal(AI_PROVIDER_NAME, "Muse AI");
});

check("provider name from env is honoured, but live still requires a key and a budget cap", () => {
  const status = getAiProviderStatus({ GCS_AI_PROVIDER: "Muse AI" });
  assert.equal(status.providerSelected, "Muse AI");
  assert.equal(status.live, false);
  assert.equal(status.mode, "local-fallback");
});

check("fallback to local writer with no key, even when a model is configured", () => {
  const status = getAiProviderStatus({ GCS_AI_PROVIDER: "Muse AI", GCS_AI_MODEL: "test-model-name" });
  assert.equal(status.hasKey, false);
  assert.equal(status.live, false);
  assert.equal(selectWriterMode(status), "local");
  const result = requestConnectedRewrite(status, "Sample CV text, fictional.");
  assert.equal(result.live, false);
  assert.equal(result.sent, false);
  assert.equal(result.mode, "local-fallback");
});

check("fallback to local writer when a key is set but no budget cap is set", () => {
  const status = getAiProviderStatus({ GCS_AI_PROVIDER: "Muse AI", GCS_AI_API_KEY: "yes" });
  assert.equal(status.hasKey, true);
  assert.equal(status.budgetCapSet, false);
  assert.equal(status.live, false);
  assert.equal(selectWriterMode(status), "local");
});

check("live only when key and budget cap are both set", () => {
  const status = getAiProviderStatus({ GCS_AI_PROVIDER: "Muse AI", GCS_AI_API_KEY: "yes", GCS_AI_BUDGET_CAP: "yes" });
  assert.equal(status.live, true);
  assert.equal(status.liveReady, true);
  assert.equal(selectWriterMode(status), "connected");
});

check("status object never contains a key value", () => {
  const key = "yes";
  const status = getAiProviderStatus({ GCS_AI_PROVIDER: "Muse AI", GCS_AI_API_KEY: key, GCS_AI_BUDGET_CAP: "yes" });
  const text = JSON.stringify(status);
  assert.ok(!text.includes(key));
  assert.ok(!text.includes("yes-secret"));
  assert.ok(!("apiKey" in status));
  assert.ok(!("key" in status));
});

check("redactSecrets removes a key value and key style assignments from log text", () => {
  const key = "sample-secret-phrase-for-redaction-test-only";
  const logged = redactSecrets(`starting with key ${key} and GCS_AI_API_KEY=${key} done`, key);
  assert.ok(!logged.includes(key));
  assert.ok(logged.includes("[REDACTED]"));
  const plain = redactSecrets("api_key: some-secret-value-here", "");
  assert.ok(!plain.includes("some-secret-value-here"));
});

check("guardrails unchanged: local rewrite invents nothing and needs confirmation", () => {
  const result = suggestSummaryRewrite("I was responsible for coordinating sample project schedules.");
  assert.ok(result.suggested.includes("Coordinated"));
  assert.ok(!result.suggested.includes("Google"));
  assert.ok(!result.suggested.includes("2020"));
  assert.ok(!result.suggested.includes("PhD"));
  assert.equal(applyRewrite("original text", result.suggested, false), "original text");
  assert.equal(applyRewrite("original text", result.suggested, true), result.suggested);
  const empty = suggestSummaryRewrite("");
  assert.equal(empty.suggested, "");
  assert.ok(empty.prompt.length > 0);
});

check("no CV text is sent in fallback mode", () => {
  const status = getAiProviderStatus({});
  const result = requestConnectedRewrite(status, "My real CV text would go here in a live call.");
  assert.equal(result.sent, false);
  assert.equal(result.suggested, "");
  assert.ok(!JSON.stringify(result).includes("My real CV text"));
});

console.log(`${passed} passed, 0 failed`);
