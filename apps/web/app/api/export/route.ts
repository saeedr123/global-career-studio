import { NextResponse } from "next/server";
import {
  renderDocument,
  renderDocx,
  renderPdf
} from "@global-career-studio/template-engine";
import { canExportDocument } from "../../../lib/billing-core.mjs";

// Export API, Phase 2 increment 3.
// Uses the real template engine, not a screenshot or a placeholder file.
// PDF has selectable text, DOCX has real headings, paragraphs, and lists.
// Custom sections are passed through to the engine, so they appear in
// exports as well as in the builder preview. No account, payment, AI, or
// database is involved here. Drafts are local browser drafts only.

export const runtime = "nodejs";

const TEMPLATE_IDS = [
  "ats-minimal",
  "modern-professional",
  "executive",
  "corporate",
  "elegant",
  "european",
  "us-resume",
  "uk-cv",
  "sidebar",
  "two-column"
] as const;
type TemplateId = (typeof TEMPLATE_IDS)[number];
function isTemplate(value: unknown): value is TemplateId {
  return typeof value === "string" && (TEMPLATE_IDS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = body?.profile;
    const settings = body?.settings;
    const format = body?.format;
    if (!profile || !settings || !isTemplate(settings.templateId)) {
      return NextResponse.json({ error: "Profile and a valid template are required." }, { status: 400 });
    }
    if (format !== "pdf" && format !== "docx") {
      return NextResponse.json({ error: "Format must be pdf or docx." }, { status: 400 });
    }
    if (typeof body?.subscriptionPlan === "string") {
      const entitlement = canExportDocument({
        planId: body.subscriptionPlan,
        templateId: settings.templateId,
        format,
        existingDocument: Boolean(body.existingDocument)
      });
      if (!entitlement.allowed) {
        return NextResponse.json({ error: entitlement.reason }, { status: 403 });
      }
    }
    const engineProfile = {
      ...profile,
      sampleMarker: "SAMPLE" as const
    };
    const rendered = renderDocument(engineProfile, settings.templateId, {
      paperSize: settings.paperSize === "US_LETTER" ? "US_LETTER" : "A4",
      pageCountTarget: 1,
      includePhoto: Boolean(settings.includePhoto),
      sectionOrder: settings.sectionOrder
    });
    if (format === "pdf") {
      const buffer = await renderPdf(rendered);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${settings.templateId}.pdf"`
        }
      });
    }
    const buffer = await renderDocx(rendered);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${settings.templateId}.docx"`
      }
    });
  } catch (error) {
    // Server log only. The client response stays plain language, with
    // no system details, so a failure never leaks internals to a user.
    console.error("Export failed", error);
    return NextResponse.json(
      { error: "Export failed. Your draft was not changed. Please try again." },
      { status: 500 }
    );
  }
}
