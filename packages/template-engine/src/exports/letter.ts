import PDFDocument from "pdfkit";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

// Letter export, Phase 2 increment 7.
// Renders letter text the user already checked, as PDF with selectable
// text and DOCX with real paragraphs, not a screenshot or a PDF image
// inside Word. The letter text comes from the letter studio, which
// uses only fields the user supplied.

export function cleanLetterParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

export function renderLetterPdf(title: string, paragraphs: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: [595.28, 841.89], margins: { top: 48, bottom: 48, left: 48, right: 48 } });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
    pdf.font("Helvetica-Bold").fontSize(16).text(title, { width: 499 });
    pdf.moveDown(1);
    pdf.font("Helvetica").fontSize(11);
    for (const paragraph of paragraphs) {
      pdf.text(paragraph, { width: 499 });
      pdf.moveDown(0.6);
    }
    pdf.end();
  });
}

export async function renderLetterDocx(title: string, paragraphs: string[]): Promise<Buffer> {
  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: title, bold: true, size: 32 })]
    }),
    ...paragraphs.map(
      (paragraph) =>
        new Paragraph({
          children: [new TextRun({ text: paragraph, size: 22 })]
        })
    )
  ];
  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: "portrait" },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children
      }
    ]
  });
  return Packer.toBuffer(document);
}
