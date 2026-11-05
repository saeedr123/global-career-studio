import { NextResponse } from "next/server";
import {
  extractDocxText,
  extractPdfText
} from "@global-career-studio/template-engine";
import { parseFileImport } from "../../../lib/builder-core.mjs";
import { detectLanguage, importErrors, LANGUAGE_NAMES } from "../../../lib/error-format.mjs";
import { languagePackById } from "../../../lib/packs-core.mjs";

// File import API, Phase 2 increment 5.
// Accepts one PDF or DOCX file, extracts its text, parses it into
// profile fields, and returns the parsed profile with warnings and
// unparsed lines for correction. Nothing is stored and nothing
// becomes a draft here. The builder page only applies the import after
// the user checks and corrects it. A file with no readable text, for
// example a scanned image PDF, is reported as empty, with no content
// invented. Every error carries an error and a solution, never a bare
// string, and a failed import leaves the current draft exactly as it
// was. The builder sends its language id with the file; when the
// detected language of the extracted text does not match it, the
// response carries a language mismatch with a solution instead of
// silently applying a CV in the wrong language. LinkedIn export
// import is a separate route at app/api/linkedin-import/route.ts,
// with the same correction step on the builder page. LinkedIn API
// import is not built.

export const runtime = "nodejs";
const MAX_BYTES = 5 * 1024 * 1024;

function fileExtension(fileName: string) {
  const name = String(fileName || "");
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) {
    return "unknown format";
  }
  return `.${name.slice(dot + 1).toLowerCase()}`;
}

export async function POST(request: Request) {
  const errors = importErrors();
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json(errors.noFile(), { status: 400 });
    }
    const name = (file.name || "").toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isDocx = name.endsWith(".docx");
    if (!isPdf && !isDocx) {
      return NextResponse.json(
        errors.wrongFormat(file.name, fileExtension(file.name)),
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json(errors.emptyFile(file.name), { status: 400 });
    }
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json(errors.oversize(file.name), { status: 400 });
    }
    const extracted = isPdf ? await extractPdfText(buffer) : extractDocxText(buffer);
    const parsed = parseFileImport(extracted.text);
    const languageId = String(form.get("languageId") || "en");
    const expectedName = LANGUAGE_NAMES[languageId as keyof typeof LANGUAGE_NAMES] || languagePackById(languageId).name || "English";
    const detected = detectLanguage(extracted.text);
    let languageMismatch = null;
    let languageUnknown = null;
    if (detected.language !== "unknown" && detected.language !== languageId) {
      const mismatch = errors.languageMismatch(
        LANGUAGE_NAMES[detected.language as keyof typeof LANGUAGE_NAMES] || detected.language,
        expectedName
      );
      languageMismatch = {
        detected: detected.language,
        detectedName: LANGUAGE_NAMES[detected.language as keyof typeof LANGUAGE_NAMES] || detected.language,
        expected: languageId,
        expectedName,
        ...mismatch
      };
    } else if (detected.language === "unknown" && String(extracted.text || "").length >= 100) {
      const unknown = errors.languageUnknown(expectedName);
      languageUnknown = { expected: languageId, expectedName, ...unknown };
    }
    return NextResponse.json({
      format: isPdf ? "pdf" : "docx",
      fileName: file.name,
      pageCount: extracted.pageCount,
      extractedText: extracted.text,
      profile: parsed.profile,
      warnings: parsed.warnings,
      unparsedLines: parsed.unparsedLines,
      empty: parsed.empty,
      solution: parsed.empty ? errors.unreadable().solution : undefined,
      languageMismatch,
      languageUnknown
    });
  } catch (error) {
    console.error("File import failed", error);
    return NextResponse.json(errors.failed(), { status: 500 });
  }
}
