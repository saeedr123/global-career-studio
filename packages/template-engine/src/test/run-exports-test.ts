import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
// pdf-parse was tried first and gave flaky, inconsistent parse errors on
// valid PDFKit output (the same file passed once and failed the next run),
// while pdftotext read every file correctly. The test therefore uses
// pdfjs-dist for extraction, which parsed all proof PDFs reliably.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.js";
import { longSample, renderDocx, renderDocument, renderPdf, shortSample } from "../index";
import type { CandidateProfile, TemplateId } from "../index";

const NAME = "Sam Sample";
const JOB = "Sample Project Coordinator";
const outDir = path.join(__dirname, "..", "..", "test-output");

interface CaseResult {
  label: string;
  pass: boolean;
  detail: string;
}

async function extractPdf(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + " ";
  }
  return { text, numpages: doc.numPages };
}

function docxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) {
    return "";
  }
  const xml = entry.getData().toString("utf8");
  const parts: string[] = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    parts.push(match[1]);
  }
  return parts.join(" ");
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const results: CaseResult[] = [];
  const templates: TemplateId[] = ["ats-minimal", "modern-professional"];
  const samples: Array<{ label: string; profile: CandidateProfile }> = [
    { label: "short", profile: shortSample },
    { label: "long", profile: longSample }
  ];

  for (const templateId of templates) {
    for (const sample of samples) {
      const rendered = renderDocument(sample.profile, templateId, {
        paperSize: "A4",
        pageCountTarget: sample.label === "long" ? 2 : 1,
        includePhoto: false
      });

      // PDF case
      try {
        const pdfBuffer = await renderPdf(rendered);
        const pdfPath = path.join(outDir, `${templateId}-${sample.label}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);
        const parsed = await extractPdf(pdfBuffer);
        const hasName = parsed.text.includes(NAME);
        const hasJob = parsed.text.includes(JOB);
        const pagesOk =
          sample.label === "long" ? parsed.numpages >= 2 : parsed.numpages >= 1;
        const pass =
          pdfBuffer.length > 0 && hasName && hasJob && pagesOk;
        results.push({
          label: `${templateId} / ${sample.label} / PDF`,
          pass,
          detail: `file=${path.basename(pdfPath)} size=${pdfBuffer.length} bytes pages=${parsed.numpages} name=${hasName} job=${hasJob}`
        });
      } catch (error) {
        results.push({
          label: `${templateId} / ${sample.label} / PDF`,
          pass: false,
          detail: `error=${error instanceof Error ? error.message : String(error)}`
        });
      }

      // DOCX case
      try {
        const docxBuffer = await renderDocx(rendered);
        const docxPath = path.join(outDir, `${templateId}-${sample.label}.docx`);
        fs.writeFileSync(docxPath, docxBuffer);
        const text = docxText(docxBuffer);
        const hasName = text.includes(NAME);
        const hasJob = text.includes(JOB);
        const pass = docxBuffer.length > 0 && hasName && hasJob;
        results.push({
          label: `${templateId} / ${sample.label} / DOCX`,
          pass,
          detail: `file=${path.basename(docxPath)} size=${docxBuffer.length} bytes name=${hasName} job=${hasJob}`
        });
      } catch (error) {
        results.push({
          label: `${templateId} / ${sample.label} / DOCX`,
          pass: false,
          detail: `error=${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  }

  // Engine behaviour checks, separate from export files.
  const custom = renderDocument(shortSample, "modern-professional", {
    paperSize: "US_LETTER",
    pageCountTarget: 1,
    includePhoto: true,
    sectionOrder: ["skills", "experience"]
  });
  const orderOk =
    custom.sections[0].key === "skills" && custom.sections[1].key === "experience";
  results.push({
    label: "engine / custom section order (Modern, US Letter)",
    pass: orderOk,
    detail: `order=${custom.sections.map((s) => s.key).join(",")}`
  });
  results.push({
    label: "engine / photo flag (Modern true, ATS false)",
    pass:
      custom.photoIncluded === true &&
      renderDocument(shortSample, "ats-minimal", {
        paperSize: "A4",
        pageCountTarget: 1,
        includePhoto: true
      }).photoIncluded === false,
    detail: "Modern photoIncluded=true, ATS photoIncluded=false (ATS has no photo by design)"
  });

  let failed = 0;
  for (const result of results) {
    console.log(`${result.pass ? "PASS" : "FAIL"}: ${result.label} | ${result.detail}`);
    if (!result.pass) {
      failed += 1;
    }
  }
  console.log(`Total: ${results.length - failed} passed, ${failed} failed, out of ${results.length}.`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`FAIL: test runner error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
