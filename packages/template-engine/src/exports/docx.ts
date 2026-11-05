import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import type { RenderedDocument, RenderSection } from "../types";

// DOCX export with real headings, paragraphs, and lists.
// Nothing here is a PDF image inside Word. Every line is editable text.
// Sidebar and two-column use a real two cell table in Word, so the
// columns are editable, not an image. Those templates are design first
// in the builder, never labelled ATS friendly.

function sectionParagraphs(
  doc: RenderedDocument,
  sections: RenderSection[]
): Paragraph[] {
  const out: Paragraph[] = [];
  const accent = doc.template.accentColor;
  for (const section of sections) {
    const title = doc.template.headingUppercase
      ? section.title.toUpperCase()
      : section.title;
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: doc.template.headingSize * 2,
            color: accent === "000000" ? "000000" : accent
          })
        ]
      })
    );
    for (const line of section.lines) {
      out.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: doc.template.bodySize * 2 })]
        })
      );
    }
    for (const group of section.bullets) {
      group.forEach((line, index) => {
        if (index === 0) {
          out.push(
            new Paragraph({
              children: [
                new TextRun({ text: line, bold: true, size: doc.template.bodySize * 2 })
              ]
            })
          );
        } else {
          out.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: line, size: doc.template.bodySize * 2 })]
            })
          );
        }
      });
    }
  }
  return out;
}

export async function renderDocx(doc: RenderedDocument): Promise<Buffer> {
  const template = doc.template;
  const isBand = template.headerStyle === "band";
  const isCentered = template.headerStyle === "centered";
  // Twips: A4 11906 x 16838, US Letter 12240 x 15840. docx v9 takes
  // explicit width and height, not a named page size constant.
  const pageSize =
    doc.options.paperSize === "US_LETTER"
      ? { width: 12240, height: 15840 }
      : { width: 11906, height: 16838 };
  const children: Array<Paragraph | Table> = [];

  const nameAlign = isCentered ? AlignmentType.CENTER : AlignmentType.LEFT;
  if (isBand) {
    children.push(
      new Paragraph({
        alignment: nameAlign,
        shading: { type: ShadingType.SOLID, fill: "16294D" },
        children: [
          new TextRun({
            text: doc.profile.fullName,
            bold: true,
            size: template.nameSize * 2,
            color: "FFFFFF"
          })
        ]
      }),
      new Paragraph({
        alignment: nameAlign,
        shading: { type: ShadingType.SOLID, fill: "16294D" },
        children: [
          new TextRun({ text: doc.profile.headline, size: 24, color: "FFFFFF" })
        ]
      })
    );
  } else {
    children.push(
      new Paragraph({
        alignment: nameAlign,
        children: [
          new TextRun({
            text: doc.profile.fullName,
            bold: true,
            size: template.nameSize * 2
          })
        ]
      }),
      new Paragraph({
        alignment: nameAlign,
        children: [new TextRun({ text: doc.profile.headline, size: 22 })]
      })
    );
  }

  if (template.headerStyle === "european") {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Personal Information", bold: true, size: 24 })]
      }),
      new Paragraph({
        children: [new TextRun({ text: `Email: ${doc.profile.email}`, size: 20 })]
      }),
      new Paragraph({
        children: [new TextRun({ text: `Phone: ${doc.profile.phone}`, size: 20 })]
      }),
      new Paragraph({
        children: [new TextRun({ text: `City: ${doc.profile.city}`, size: 20 })]
      })
    );
  } else {
    children.push(
      new Paragraph({
        alignment: nameAlign,
        children: [
          new TextRun({
            text:
              doc.profile.sampleMarker === "SAMPLE"
                ? `SAMPLE: ${doc.profile.email} | ${doc.profile.phone} | ${doc.profile.city}`
                : `${doc.profile.email} | ${doc.profile.phone} | ${doc.profile.city}`,
            size: 20
          })
        ]
      })
    );
  }

  if (doc.photoIncluded && doc.profile.sampleMarker === "SAMPLE") {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "[SAMPLE photo placeholder]", size: 18 })]
      })
    );
  }

  if (template.layoutKind === "sidebar" || template.layoutKind === "two-column") {
    const sideKeys = new Set(["skills", "languages"]);
    const sideSections = doc.sections.filter((s) => sideKeys.has(s.key));
    const mainSections = doc.sections.filter((s) => !sideKeys.has(s.key));
    const sideCell = new TableCell({
      width: { size: template.layoutKind === "sidebar" ? 30 : 40, type: WidthType.PERCENTAGE },
      children: sectionParagraphs(doc, sideSections)
    });
    const mainCell = new TableCell({
      width: { size: template.layoutKind === "sidebar" ? 70 : 60, type: WidthType.PERCENTAGE },
      children: sectionParagraphs(doc, mainSections)
    });
    const row = new TableRow({
      children:
        template.layoutKind === "sidebar" ? [sideCell, mainCell] : [mainCell, sideCell]
    });
    children.push(
      new Table({
        rows: [row],
        width: { size: 100, type: WidthType.PERCENTAGE }
      })
    );
  } else {
    children.push(...sectionParagraphs(doc, doc.sections));
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageSize.width,
              height: pageSize.height,
              orientation: "portrait"
            },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children
      }
    ]
  });

  void AlignmentType.LEFT;
  return Packer.toBuffer(document);
}
