import { NextResponse } from "next/server";

// AI status route, Phase 2 increment 11. Returns only safe status:
// provider name, whether a model is configured, whether a key is
// configured, whether a budget cap is set, and whether connected
// Muse AI is live. It never returns a key, a model value, or any
// secret. Connected Muse AI is NOT live until the owner adds a key
// (GCS_AI_API_KEY) and sets a budget cap (GCS_AI_BUDGET_CAP).

export const dynamic = "force-dynamic";

export async function GET() {
  const providerRaw = process.env.GCS_AI_PROVIDER || "";
  const provider = providerRaw.trim() || "Muse AI";
  const modelConfigured = Boolean((process.env.GCS_AI_MODEL || "").trim());
  const hasKey = Boolean((process.env.GCS_AI_API_KEY || "").trim());
  const budgetCapSet = Boolean((process.env.GCS_AI_BUDGET_CAP || "").trim());
  const live = hasKey && budgetCapSet && provider === "Muse AI";
  return NextResponse.json({
    provider,
    providerSelected: provider,
    modelConfigured,
    hasKey,
    keyConfigured: hasKey,
    budgetCapSet,
    live,
    liveReady: live,
    mode: live ? "connected" : "local-fallback",
    statusText: live
      ? "Connected Muse AI is live, within the owner set budget cap."
      : "Connected Muse AI is ready for a key and is NOT live until the owner adds a key and sets a budget cap. Local writer is used until then."
  });
}
