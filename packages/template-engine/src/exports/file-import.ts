import AdmZip from "adm-zip";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.js";

// File text extraction for import, Phase 2 increment 5.
// PDF: text is grouped by line using the text item y coordinate, so
// headings and bullet lines stay on their own lines, instead of being
// joined into one long string. DOCX: paragraphs are kept in document
// order, so each paragraph becomes one line for the parser. Neither
// extractor invents content. A PDF with no text items is reported as
// empty by the caller, which is the correct plain message for a
// scanned image file, not a guessed CV.

export interface ExtractedFileText {
  text: string;
  lines: string[];
  pageCount: number;
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractedFileText> {
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const allLines: string[] = [];
  for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex++) {
    const page = await doc.getPage(pageIndex);
    const content = await page.getTextContent();
    type Item = { str: string; x: number; y: number };
    const items: Item[] = [];
    for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
      const str = (item.str || "").trim();
      if (!str) {
        continue;
      }
      const transform = item.transform || [0, 0, 0, 0, 0, 0];
      items.push({ str, x: transform[4] || 0, y: transform[5] || 0 });
    }
    // Group by y, with a small tolerance, then sort top to bottom and
    // left to right inside each line. PDF y grows upwards, so larger
    // y comes first.
    const groups: Item[][] = [];
    for (const item of items) {
      const group = groups.find((candidate) => Math.abs(candidate[0].y - item.y) <= 3);
      if (group) {
        group.push(item);
      } else {
        groups.push([item]);
      }
    }
    groups.sort((a, b) => b[0].y - a[0].y);
    for (const group of groups) {
      group.sort((a, b) => a.x - b.x);
      const line = group.map((item) => item.str).join(" ").trim();
      if (line) {
        allLines.push(line);
      }
    }
  }
  return { text: allLines.join("\n"), lines: allLines, pageCount: doc.numPages };
}

export function extractDocxText(buffer: Buffer): ExtractedFileText {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) {
    return { text: "", lines: [], pageCount: 0 };
  }
  const xml = entry.getData().toString("utf8");
  const lines: string[] = [];
  const paragraphRe = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let paragraphMatch: RegExpExecArray | null;
  while ((paragraphMatch = paragraphRe.exec(xml)) !== null) {
    const paragraph = paragraphMatch[0];
    const parts: string[] = [];
    const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textRe.exec(paragraph)) !== null) {
      parts.push(decodeXmlText(textMatch[1]));
    }
    const line = parts.join("").trim();
    if (line) {
      lines.push(line);
    }
  }
  // Fallback only if no paragraphs were matched at all. Paragraphs
  // inside table cells, as used by sidebar and two-column exports,
  // are matched by the paragraph scan above, in document order, and
  // their headings reset the parser section, so skills and languages
  // are not lost.
  if (lines.length === 0) {
    const parts: string[] = [];
    const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textRe.exec(xml)) !== null) {
      parts.push(decodeXmlText(textMatch[1]));
    }
    const joined = parts.join(" ").trim();
    if (joined) {
      lines.push(joined);
    }
  }
  return { text: lines.join("\n"), lines, pageCount: 0 };
}
