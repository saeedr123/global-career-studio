import { NextResponse } from "next/server";
import {
  extractDocxText,
  extractPdfText
} from "@global-career-studio/template-engine";
import { parseFileImport } from "../../../lib/builder-core.mjs";

// File import API, Phase 2 increment 5.
// Accepts one PDF or DOCX file, extracts its text, parses it into
// profile fields, and returns the parsed profile with warnings and
// unparsed lines for correction. Nothing is stored and nothing
// becomes a draft here. The builder page only applies the import after
// the user checks and corrects it. A file with no readable text, for
// example a scanned image PDF, is reported as empty, with no content
// invented. LinkedIn export import is a separate route at
// app/api/linkedin-import/route.ts, with the same correction step
// on the builder page. LinkedIn API import is not built.

export const runtime = "nodejs";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "A PDF or DOCX file is required." }, { status: 400 });
    }
    const name = (file.name || "").toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isDocx = name.endsWith(".docx");
    if (!isPdf && !isDocx) {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported here." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "The file is empty or larger than 5 MB." }, { status: 400 });
    }
    const extracted = isPdf ? await extractPdfText(buffer) : extractDocxText(buffer);
    const parsed = parseFileImport(extracted.text);
    return NextResponse.json({
      format: isPdf ? "pdf" : "docx",
      fileName: file.name,
      pageCount: extracted.pageCount,
      extractedText: extracted.text,
      profile: parsed.profile,
      warnings: parsed.warnings,
      unparsedLines: parsed.unparsedLines,
      empty: parsed.empty
    });
  } catch (error) {
    console.error("File import failed", error);
    return NextResponse.json(
      { error: "File import failed. Your draft was not changed. Please check the file and try again." },
      { status: 500 }
    );
  }
}
