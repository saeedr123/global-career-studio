import PDFDocument from "pdfkit";
import type { RenderedDocument } from "../types";

// PDF export with selectable text. No page is rendered as an image.
// Text is written with PDFKit text calls, so extraction tools can read it.
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
    const gold = "#d9a441";

    if (doc.template.id === "modern-professional") {
      // Navy header block. Text stays selectable, it is not an image.
      pdf.rect(0, 0, pageWidth, 96).fill(navy);
      pdf.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22);
      pdf.text(doc.profile.fullName, margin, 18, { width: textWidth });
      pdf.font("Helvetica").fontSize(12);
      pdf.text(doc.profile.headline, margin, 48, { width: textWidth });
      pdf.fillColor("#000000");
      pdf.y = 112;
      if (doc.photoIncluded) {
        pdf.rect(margin, pdf.y, 80, 100).stroke();
        pdf.font("Helvetica").fontSize(9);
        pdf.text("SAMPLE PHOTO", margin + 6, pdf.y + 42, { width: 68 });
        pdf.y += 112;
      }
      pdf.font("Helvetica").fontSize(10);
      pdf.text(
        `SAMPLE: ${doc.profile.email} | ${doc.profile.phone} | ${doc.profile.city}`,
        margin,
        pdf.y,
        { width: textWidth }
      );
      pdf.moveDown(1);
      for (const section of doc.sections) {
        pdf.font("Helvetica-Bold").fontSize(13).fillColor(navy);
        pdf.text(section.title, margin, pdf.y, { width: textWidth });
        const lineY = pdf.y + 2;
        pdf.strokeColor(gold).lineWidth(1.5);
        pdf.moveTo(margin, lineY).lineTo(margin + 48, lineY).stroke();
        pdf.strokeColor("#000000").fillColor("#000000");
        pdf.moveDown(0.6);
        pdf.font("Helvetica").fontSize(11);
        for (const line of section.lines) {
          pdf.text(line, { width: textWidth });
        }
        for (const group of section.bullets) {
          group.forEach((line, index) => {
            if (index === 0) {
              pdf.font("Helvetica-Bold").text(line, { width: textWidth });
              pdf.font("Helvetica");
            } else {
              pdf.text(`- ${line}`, { width: textWidth });
            }
          });
          pdf.moveDown(0.4);
        }
        pdf.moveDown(0.6);
      }
    } else {
      // ATS Minimal: plain single column, standard headings, no accents.
      pdf.font("Helvetica-Bold").fontSize(18);
      pdf.text(doc.profile.fullName, { width: textWidth });
      pdf.font("Helvetica").fontSize(10.5);
      pdf.text(doc.profile.headline, { width: textWidth });
      pdf.text(
        `SAMPLE: ${doc.profile.email} | ${doc.profile.phone} | ${doc.profile.city}`,
        { width: textWidth }
      );
      pdf.moveDown(1);
      for (const section of doc.sections) {
        pdf.font("Helvetica-Bold").fontSize(11);
        pdf.text(section.title.toUpperCase(), { width: textWidth });
        pdf.font("Helvetica").fontSize(10.5);
        for (const line of section.lines) {
          pdf.text(line, { width: textWidth });
        }
        for (const group of section.bullets) {
          group.forEach((line, index) => {
            if (index === 0) {
              pdf.font("Helvetica-Bold").text(line, { width: textWidth });
              pdf.font("Helvetica");
            } else {
              pdf.text(`- ${line}`, { width: textWidth });
            }
          });
          pdf.moveDown(0.4);
        }
        pdf.moveDown(0.6);
      }
    }

    pdf.end();
  });
}
