import { NextResponse } from "next/server";
import {
  cleanLetterParagraphs,
  renderLetterDocx,
  renderLetterPdf
} from "@global-career-studio/template-engine";

// Letter export API, Phase 2 increment 7.
// Renders letter text the user already checked, through the real
// template engine: PDF with selectable text and DOCX with real
// paragraphs, not a screenshot or a PDF image inside Word. No account,
// payment, AI, or database is involved here. Letters are local drafts
// only until a real database is connected.

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title || "Letter").trim() || "Letter";
    const paragraphs = cleanLetterParagraphs(body?.paragraphs);
    const format = body?.format;
    if (paragraphs.length === 0) {
      return NextResponse.json({ error: "Letter text is required for export." }, { status: 400 });
    }
    if (format === "pdf") {
      const buffer = await renderLetterPdf(title, paragraphs);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="letter.pdf"`
        }
      });
    }
    if (format === "docx") {
      const buffer = await renderLetterDocx(title, paragraphs);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="letter.docx"`
        }
      });
    }
    return NextResponse.json({ error: "Format must be pdf or docx." }, { status: 400 });
  } catch (error) {
    console.error("Letter export failed", error);
    return NextResponse.json(
      { error: "Letter export failed. Your draft was not changed. Please try again." },
      { status: 500 }
    );
  }
}
