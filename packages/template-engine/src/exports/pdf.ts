import PDFDocument from "pdfkit";
import type { RenderedDocument, RenderSection } from "../types";

// PDF export with selectable text. No page is rendered as an image.
// Text is written with PDFKit text calls, so extraction tools can read it.
// For sidebar and two-column templates, the visual layout is two
// columns, but the text extraction order follows the drawing order.
// That is why those two templates are labelled design first in the
// builder, never ATS friendly, with ATS Minimal recommended for
// portal uploads.

type PdfDoc = InstanceType<typeof PDFDocument>;

function fontName(doc: RenderedDocument, bold: boolean): string {
  if (doc.template.font === "Times") {
    return bold ? "Times-Bold" : "Times-Roman";
  }
  return bold ? "Helvetica-Bold" : "Helvetica";
}

function drawPhotoBox(
  pdf: PdfDoc,
  margin: number,
  width: number
): void {
  pdf.rect(margin, pdf.y, 80, 100).stroke();
  pdf.font("Helvetica").fontSize(9);
  pdf.text("SAMPLE PHOTO", margin + 6, pdf.y + 42, { width: 68 });
  pdf.y += 112;
}

function drawSection(
  pdf: PdfDoc,
  doc: RenderedDocument,
  section: RenderSection,
  width: number,
  accentLine: boolean
): void {
  const accent = `#${doc.template.accentColor}`;
  const title = doc.template.headingUppercase
    ? section.title.toUpperCase()
    : section.title;
  pdf.font(fontName(doc, true)).fontSize(doc.template.headingSize).fillColor(accent);
  pdf.text(title, { width });
  if (accentLine) {
    const lineY = pdf.y + 2;
    pdf.strokeColor(accent).lineWidth(1.5);
    pdf.moveTo(pdf.x, lineY).lineTo(pdf.x + 48, lineY).stroke();
    pdf.strokeColor("#000000").fillColor("#000000");
    pdf.moveDown(0.6);
  } else {
    pdf.fillColor("#000000");
  }
  pdf.font(fontName(doc, false)).fontSize(doc.template.bodySize);
  for (const line of section.lines) {
    pdf.text(line, { width });
  }
  for (const group of section.bullets) {
    group.forEach((line, index) => {
      if (index === 0) {
        pdf.font(fontName(doc, true)).text(line, { width });
        pdf.font(fontName(doc, false));
      } else {
        pdf.text(`- ${line}`, { width });
      }
    });
    pdf.moveDown(0.4);
  }
  pdf.moveDown(0.6);
}

function drawFlowSections(
  pdf: PdfDoc,
  doc: RenderedDocument,
  sections: RenderSection[],
  width: number,
  accentLine: boolean
): void {
  for (const section of sections) {
    drawSection(pdf, doc, section, width, accentLine);
  }
}

export function renderPdf(doc: RenderedDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isLetter = doc.options.paperSize === "US_LETTER";
    const size: [number, number] = isLetter ? [612, 792] : [595.28, 841.89];
    const pdf = new PDFDocument({ size, margins: { top: 48, bottom: 48, left: 48, right: 48 } });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    const pageWidth = size[0];
    const margin = 48;
    const textWidth = pageWidth - margin * 2;
    const navy = "#16294d";
    const accent = `#${doc.template.accentColor}`;
    const template = doc.template;
    const contactLine = doc.profile.sampleMarker === "SAMPLE"
      ? `SAMPLE: ${doc.profile.email} | ${doc.profile.phone} | ${doc.profile.city}`
      : `${doc.profile.email} | ${doc.profile.phone} | ${doc.profile.city}`;

    // Header, per template style.
    if (template.headerStyle === "band") {
      pdf.rect(0, 0, pageWidth, 96).fill(navy);
      pdf.fillColor("#ffffff").font(fontName(doc, true)).fontSize(template.nameSize);
      pdf.text(doc.profile.fullName, margin, 18, { width: textWidth });
      pdf.font(fontName(doc, false)).fontSize(12);
      pdf.text(doc.profile.headline, margin, 48, { width: textWidth });
      pdf.fillColor("#000000");
      pdf.y = 112;
    } else if (template.headerStyle === "centered") {
      pdf.font(fontName(doc, true)).fontSize(template.nameSize);
      pdf.text(doc.profile.fullName, { width: textWidth, align: "center" });
      pdf.font(fontName(doc, false)).fontSize(12);
      pdf.text(doc.profile.headline, { width: textWidth, align: "center" });
      pdf.font(fontName(doc, false)).fontSize(10);
      pdf.text(contactLine, { width: textWidth, align: "center" });
      const ruleY = pdf.y + 4;
      pdf.strokeColor(accent).lineWidth(1);
      pdf.moveTo(margin, ruleY).lineTo(pageWidth - margin, ruleY).stroke();
      pdf.strokeColor("#000000");
      pdf.moveDown(1);
    } else if (template.headerStyle === "european") {
      pdf.font(fontName(doc, true)).fontSize(template.nameSize);
      pdf.text(doc.profile.fullName, { width: textWidth });
      pdf.font(fontName(doc, false)).fontSize(template.bodySize);
      pdf.text("Personal Information", { width: textWidth });
      pdf.text(`Email: ${doc.profile.email}`, { width: textWidth });
      pdf.text(`Phone: ${doc.profile.phone}`, { width: textWidth });
      pdf.text(`City: ${doc.profile.city}`, { width: textWidth });
      pdf.moveDown(1);
    } else {
      // Plain header, ATS Minimal, US Resume, UK CV, Two-column.
      pdf.font(fontName(doc, true)).fontSize(template.nameSize);
      pdf.text(doc.profile.fullName, { width: textWidth });
      pdf.font(fontName(doc, false)).fontSize(template.bodySize);
      pdf.text(doc.profile.headline, { width: textWidth });
      pdf.text(contactLine, { width: textWidth });
      pdf.moveDown(1);
    }

    // For band and plain headers, the contact line is not yet drawn
    // for band headers, and the photo box goes after the contact line.
    if (template.headerStyle === "band") {
      pdf.font(fontName(doc, false)).fontSize(10);
      pdf.text(contactLine, { width: textWidth });
      pdf.moveDown(1);
    }
    if (doc.photoIncluded && doc.profile.sampleMarker === "SAMPLE") {
      drawPhotoBox(pdf, margin, textWidth);
    }

    const accentLine =
      template.id === "modern-professional" ||
      template.id === "corporate" ||
      template.id === "sidebar";

    if (template.layoutKind === "sidebar" || template.layoutKind === "two-column") {
      // Split sections: skills and languages go in the narrow column,
      // everything else goes in the main column, in template order.
      const sideKeys = new Set(["skills", "languages"]);
      const sideSections = doc.sections.filter((s) => sideKeys.has(s.key));
      const mainSections = doc.sections.filter((s) => !sideKeys.has(s.key));
      const gap = 16;
      const sideWidth = 150;
      const mainWidth = textWidth - sideWidth - gap;
      const startY = pdf.y;

      if (template.layoutKind === "sidebar") {
        // Narrow left column, drawn first, then the main column.
        pdf.x = margin;
        pdf.y = startY;
        for (const section of sideSections) {
          drawSection(pdf, doc, section, sideWidth, false);
        }
        // Main column flow, with page breaks keeping the indent.
        pdf.on("pageAdded", () => {
          pdf.x = margin + sideWidth + gap;
          pdf.y = margin;
        });
        pdf.x = margin + sideWidth + gap;
        pdf.y = startY;
        drawFlowSections(pdf, doc, mainSections, mainWidth, accentLine);
      } else {
        // Wide main column on the left, narrow right column.
        const rightX = margin + mainWidth + gap;
        pdf.x = rightX;
        pdf.y = startY;
        for (const section of sideSections) {
          drawSection(pdf, doc, section, sideWidth, false);
        }
        pdf.on("pageAdded", () => {
          pdf.x = margin;
          pdf.y = margin;
        });
        pdf.x = margin;
        pdf.y = startY;
        drawFlowSections(pdf, doc, mainSections, mainWidth, false);
      }
    } else {
      drawFlowSections(pdf, doc, doc.sections, textWidth, accentLine);
    }

    pdf.end();
  });
}
