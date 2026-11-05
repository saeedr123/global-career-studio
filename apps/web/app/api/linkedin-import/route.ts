import { NextResponse } from "next/server";
import { extractZipCsvFiles } from "@global-career-studio/template-engine";
import { parseLinkedInExports } from "../../../lib/linkedin-core.mjs";

// LinkedIn export import API, Phase 2 increment 12.
// Official data export import only. This route never contacts
// LinkedIn, never scrapes a LinkedIn page or profile, and never uses
// an unofficial API. The user uploads CSV files from their own
// LinkedIn data export, or a ZIP of those files, and this route
// parses them into profile fields for correction on the builder
// page. Nothing is stored and nothing becomes a draft here. The
// builder page only applies the import after the user checks and
// corrects it. Missing files and unknown columns are warned about,
// never filled in. The profile photo is not in the export, and dates
// in Month YYYY form are kept as written for correction.

export const runtime = "nodejs";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const uploaded = form.getAll("file");
    if (uploaded.length === 0) {
      return NextResponse.json({ error: "A LinkedIn export CSV file or ZIP file is required." }, { status: 400 });
    }
    const files: Record<string, string> = {};
    const fileNames: string[] = [];
    for (const item of uploaded) {
      if (typeof item === "string") {
        return NextResponse.json({ error: "A LinkedIn export CSV file or ZIP file is required." }, { status: 400 });
      }
      const name = (item.name || "").toLowerCase();
      const isCsv = name.endsWith(".csv");
      const isZip = name.endsWith(".zip");
      if (!isCsv && !isZip) {
        return NextResponse.json({ error: "Only LinkedIn export CSV files and ZIP files are supported here." }, { status: 400 });
      }
      const buffer = Buffer.from(await item.arrayBuffer());
      if (buffer.length === 0 || buffer.length > MAX_BYTES) {
        return NextResponse.json({ error: "A file is empty or larger than 5 MB." }, { status: 400 });
      }
      if (isZip) {
        let entries;
        try {
          entries = extractZipCsvFiles(buffer);
        } catch {
          return NextResponse.json({ error: "The ZIP file could not be read. Please check it and try again." }, { status: 400 });
        }
        if (entries.length === 0) {
          return NextResponse.json({ error: "No CSV files were found in the ZIP file." }, { status: 400 });
        }
        for (const entry of entries) {
          files[entry.name] = entry.text;
          fileNames.push(entry.name);
        }
      } else {
        files[item.name] = await item.text();
        fileNames.push(item.name);
      }
    }
    const parsed = parseLinkedInExports(files);
    return NextResponse.json({
      source: "linkedin-export",
      uploadedFiles: fileNames,
      filesParsed: parsed.filesParsed,
      filesMissing: parsed.filesMissing,
      profile: parsed.profile,
      warnings: parsed.warnings,
      unparsedLines: parsed.unparsedLines,
      empty: parsed.filesParsed.length === 0
    });
  } catch (error) {
    console.error("LinkedIn export import failed", error);
    return NextResponse.json(
      { error: "LinkedIn export import failed. Your draft was not changed. Please check the files and try again." },
      { status: 500 }
    );
  }
}
