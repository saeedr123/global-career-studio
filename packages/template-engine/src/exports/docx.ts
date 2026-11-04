import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  TextRun
} from "docx";
import type { RenderedDocument } from "../types";

// DOCX export with real headings, paragraphs, and lists.
// Nothing here is a PDF image inside Word. Every line is editable text.
export async function renderDocx(doc: RenderedDocument): Promise<Buffer> {
  const isModern = doc.template.id === "modern-professional";
  // Twips: A4 11906 x 16838, US Letter 12240 x 15840. docx v9 takes
  // explicit width and height, not a named page size constant.
  const pageSize =
    doc.options.paperSize === "US_LETTER"
      ? { width: 12240, height: 15840 }
      : { width: 11906, height: 16838 };
  const children: Paragraph[] = [];

  if (isModern) {
    children.push(
      new Paragraph({
        shading: { type: ShadingType.SOLID, fill: "16294D" },
        children: [
          new TextRun({
            text: doc.profile.fullName,
            bold: true,
            size: 44,
            color: "FFFFFF"
          })
        ]
      }),
      new Paragraph({
        shading: { type: ShadingType.SOLID, fill: "16294D" },
        children: [
          new TextRun({ text: doc.profile.headline, size: 24, color: "FFFFFF" })
        ]
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: doc.profile.fullName, bold: true, size: 36 })
        ]
      }),
      new Paragraph({
        children: [new TextRun({ text: doc.profile.headline, size: 21 })]
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `SAMPLE: ${doc.profile.email} | ${doc.profile.phone} | ${doc.profile.city}`,
          size: 20
        })
      ]
    })
  );

  if (doc.photoIncluded) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "[SAMPLE photo placeholder]", size: 18 })]
      })
    );
  }

  for (const section of doc.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: isModern ? section.title : section.title.toUpperCase(),
            bold: true,
            size: isModern ? 26 : 22,
            color: isModern ? "16294D" : "000000"
          })
        ]
      })
    );
    for (const line of section.lines) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })
      );
    }
    for (const group of section.bullets) {
      group.forEach((line, index) => {
        if (index === 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, size: 22 })]
            })
          );
        } else {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: line, size: 22 })]
            })
          );
        }
      });
    }
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

  // Keep alignment import referenced for future layout work without
  // changing rendered output in this proof.
  void AlignmentType.LEFT;
  return Packer.toBuffer(document);
}
