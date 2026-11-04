import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
// pdf-parse was tried first and gave flaky, inconsistent parse errors on
// valid PDFKit output (the same file passed once and failed the next run),
// while pdftotext read every file correctly. The test therefore uses
// pdfjs-dist for extraction, which parsed all proof PDFs reliably.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.js";
import {
  getTemplate,
  longSample,
  renderDocx,
  renderDocument,
  renderPdf,
  shortSample,
  templateIds
} from "../index";
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

function docxParts(buffer: Buffer): { text: string; xml: string } {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) {
    return { text: "", xml: "" };
  }
  const xml = entry.getData().toString("utf8");
  const parts: string[] = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    parts.push(match[1]);
  }
  return { text: parts.join(" "), xml };
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const results: CaseResult[] = [];
  const templates: TemplateId[] = templateIds();
  const samples: Array<{ label: string; profile: CandidateProfile }> = [
    { label: "short", profile: shortSample },
    { label: "long", profile: longSample }
  ];

  // Distinctness check: 10 templates, unique names, 5 standard sections
  // in each default order, and at least two different layout kinds and
  // at least two different header styles across the set. Colour alone
  // is not used as a distinctness claim here.
  {
    const names = templates.map((id) => getTemplate(id).name);
    const uniqueNames = new Set(names).size === names.length;
    const ordersOk = templates.every(
      (id) => getTemplate(id).defaultSectionOrder.length === 5
    );
    const layoutKinds = new Set(templates.map((id) => getTemplate(id).layoutKind));
    const headerStyles = new Set(templates.map((id) => getTemplate(id).headerStyle));
    results.push({
      label: "templates / 10 distinct version 1 templates",
      pass:
        templates.length === 10 &&
        uniqueNames &&
        ordersOk &&
        layoutKinds.size >= 2 &&
        headerStyles.size >= 2,
      detail: `count=${templates.length} uniqueNames=${uniqueNames} ordersOk=${ordersOk} layoutKinds=${[...layoutKinds].join(",")} headerStyles=${[...headerStyles].join(",")}`
    });
  }

  for (const templateId of templates) {
    const template = getTemplate(templateId);
    for (const sample of samples) {
      const rendered = renderDocument(sample.profile, templateId, {
        paperSize: "A4",
        pageCountTarget: sample.label === "long" ? 2 : 1,
        includePhoto: false
      });

      // PDF case, A4
      try {
        const pdfBuffer = await renderPdf(rendered);
        const pdfPath = path.join(outDir, `${templateId}-${sample.label}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);
        const parsed = await extractPdf(pdfBuffer);
        const hasName = parsed.text.includes(NAME);
        const hasJob = parsed.text.includes(JOB);
        const pagesOk =
          sample.label === "long" ? parsed.numpages >= 2 : parsed.numpages >= 1;
        const pass = pdfBuffer.length > 0 && hasName && hasJob && pagesOk;
        results.push({
          label: `${templateId} / ${sample.label} / PDF / A4`,
          pass,
          detail: `file=${path.basename(pdfPath)} size=${pdfBuffer.length} bytes pages=${parsed.numpages} name=${hasName} job=${hasJob}`
        });
      } catch (error) {
        results.push({
          label: `${templateId} / ${sample.label} / PDF / A4`,
          pass: false,
          detail: `error=${error instanceof Error ? error.message : String(error)}`
        });
      }

      // DOCX case, A4
      try {
        const docxBuffer = await renderDocx(rendered);
        const docxPath = path.join(outDir, `${templateId}-${sample.label}.docx`);
        fs.writeFileSync(docxPath, docxBuffer);
        const { text, xml } = docxParts(docxBuffer);
        const hasName = text.includes(NAME);
        const hasJob = text.includes(JOB);
        const hasHeading = xml.includes("Heading1") || xml.includes("w:style");
        const hasTable =
          template.layoutKind === "sidebar" || template.layoutKind === "two-column"
            ? xml.includes("<w:tbl")
            : true;
        const pass =
          docxBuffer.length > 0 && hasName && hasJob && hasHeading && hasTable;
        results.push({
          label: `${templateId} / ${sample.label} / DOCX / A4`,
          pass,
          detail: `file=${path.basename(docxPath)} size=${docxBuffer.length} bytes name=${hasName} job=${hasJob} heading=${hasHeading} table=${hasTable}`
        });
      } catch (error) {
        results.push({
          label: `${templateId} / ${sample.label} / DOCX / A4`,
          pass: false,
          detail: `error=${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    // US Letter PDF, short sample only, to prove paper size handling.
    try {
      const rendered = renderDocument(shortSample, templateId, {
        paperSize: "US_LETTER",
        pageCountTarget: 1,
        includePhoto: false
      });
      const pdfBuffer = await renderPdf(rendered);
      const pdfPath = path.join(outDir, `${templateId}-short-letter.pdf`);
      fs.writeFileSync(pdfPath, pdfBuffer);
      const parsed = await extractPdf(pdfBuffer);
      const pass =
        pdfBuffer.length > 0 && parsed.text.includes(NAME) && parsed.text.includes(JOB);
      results.push({
        label: `${templateId} / short / PDF / US Letter`,
        pass,
        detail: `file=${path.basename(pdfPath)} size=${pdfBuffer.length} bytes pages=${parsed.numpages} name=${parsed.text.includes(NAME)} job=${parsed.text.includes(JOB)}`
      });
    } catch (error) {
      results.push({
        label: `${templateId} / short / PDF / US Letter`,
        pass: false,
        detail: `error=${error instanceof Error ? error.message : String(error)}`
      });
    }

    // Photo case: templates that allow a photo must include the
    // placeholder text, templates that do not must report no photo.
    try {
      const rendered = renderDocument(shortSample, templateId, {
        paperSize: "A4",
        pageCountTarget: 1,
        includePhoto: true
      });
      const pdfBuffer = await renderPdf(rendered);
      const parsed = await extractPdf(pdfBuffer);
      // pdfjs splits the placeholder into separate items with an empty
      // item between them, so normalise whitespace before checking.
      const normalised = parsed.text.replace(/\s+/g, " ");
      const pass = template.photoAllowed
        ? rendered.photoIncluded === true && normalised.includes("SAMPLE PHOTO")
        : rendered.photoIncluded === false;
      results.push({
        label: `${templateId} / photo flag`,
        pass,
        detail: `photoAllowed=${template.photoAllowed} photoIncluded=${rendered.photoIncluded} placeholder=${normalised.includes("SAMPLE PHOTO")}`
      });
    } catch (error) {
      results.push({
        label: `${templateId} / photo flag`,
        pass: false,
        detail: `error=${error instanceof Error ? error.message : String(error)}`
      });
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

  // ATS Minimal text order check: summary content must appear before
  // experience content in extracted PDF text for the single column
  // parse friendly template. Sidebar and two-column are not checked
  // this way, because they are design first by design.
  try {
    const rendered = renderDocument(shortSample, "ats-minimal", {
      paperSize: "A4",
      pageCountTarget: 1,
      includePhoto: false
    });
    const pdfBuffer = await renderPdf(rendered);
    const parsed = await extractPdf(pdfBuffer);
    // Use distinct markers, not the headline: the summary body text
    // must appear before the full experience entry line, because the
    // headline also contains the job title and would match first.
    const summaryAt = parsed.text.indexOf("Fictional sample summary");
    const jobAt = parsed.text.indexOf(
      "Sample Project Coordinator, Sample Projects Ltd"
    );
    results.push({
      label: "engine / ATS Minimal text order",
      pass: summaryAt >= 0 && jobAt > summaryAt,
      detail: `summaryAt=${summaryAt} jobAt=${jobAt}`
    });
  } catch (error) {
    results.push({
      label: "engine / ATS Minimal text order",
      pass: false,
      detail: `error=${error instanceof Error ? error.message : String(error)}`
    });
  }

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
