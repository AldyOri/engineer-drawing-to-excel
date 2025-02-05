import { PDFDocument, degrees } from "pdf-lib";
import fs from "fs/promises";

const REFERENCE_DIMENSIONS = {
  width: 842, // A1 landscape
  height: 1191, // A1 landscape
} as const;

export async function normalizePDF(filePath: string): Promise<Buffer> {
  const existingPdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    // Reset rotation to 0
    page.setRotation(degrees(0));

    // Get current dimensions
    const { width, height } = page.getSize();

    // Scale to reference size
    const scaleX = REFERENCE_DIMENSIONS.width / width;
    const scaleY = REFERENCE_DIMENSIONS.height / height;
    page.scale(scaleX, scaleY);

    // Set standard MediaBox
    page.setMediaBox(
      0,
      0,
      REFERENCE_DIMENSIONS.width,
      REFERENCE_DIMENSIONS.height
    );

    // Reset position/offset
    page.resetPosition();
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
