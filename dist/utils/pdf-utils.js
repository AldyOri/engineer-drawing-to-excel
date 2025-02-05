"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePDF = void 0;
const pdf_lib_1 = require("pdf-lib");
const promises_1 = __importDefault(require("fs/promises"));
const REFERENCE_DIMENSIONS = {
    width: 1191, // A1 landscape
    height: 842, // A1 landscape
};
async function normalizePDF(filePath) {
    const existingPdfBytes = await promises_1.default.readFile(filePath);
    const pdfDoc = await pdf_lib_1.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    for (const page of pages) {
        const { width, height } = page.getSize();
        if (height > width) {
            page.setRotation((0, pdf_lib_1.degrees)(90));
        }
        else {
            page.setRotation((0, pdf_lib_1.degrees)(0));
        }
        // Scale to landscape reference size
        const scaleX = REFERENCE_DIMENSIONS.width / width;
        const scaleY = REFERENCE_DIMENSIONS.height / height;
        page.scale(scaleX, scaleY);
        // Set landscape MediaBox
        page.setMediaBox(0, 0, REFERENCE_DIMENSIONS.width, REFERENCE_DIMENSIONS.height);
        page.resetPosition();
    }
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
exports.normalizePDF = normalizePDF;
