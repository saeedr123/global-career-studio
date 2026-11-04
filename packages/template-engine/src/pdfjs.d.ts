declare module "pdfjs-dist/legacy/build/pdf.js" {
  export interface PdfTextItem {
    str: string;
  }
  export interface PdfTextContent {
    items: PdfTextItem[];
  }
  export interface PdfPage {
    getTextContent(): Promise<PdfTextContent>;
  }
  export interface PdfDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
  }
  export function getDocument(options: {
    data: Uint8Array;
  }): { promise: Promise<PdfDocument> };
}
