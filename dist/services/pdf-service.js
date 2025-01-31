"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdf_js_extract_1 = require("pdf.js-extract");
const target_coordinates_1 = __importDefault(require("../target-coordinates"));
const file_utils_1 = require("../utils/file-utils");
const path_1 = __importDefault(require("path"));
class PDFService {
    constructor() {
        this.pdfExtract = new pdf_js_extract_1.PDFExtract();
        this.options = {
            firstPage: 1,
            lastPage: 1,
            normalizeWhitespace: true,
        };
    }
    async processAllPDFs(uploadsDir, outputsDir) {
        try {
            const pdfFiles = await file_utils_1.FileUtils.getPDFFiles(uploadsDir);
            console.log(`Found ${pdfFiles.length} PDF files to process`);
            const extractedData = [];
            for (const file of pdfFiles) {
                try {
                    console.log(`Processing ${path_1.default.basename(file)}...`);
                    const data = await this.processSinglePDF(file, outputsDir);
                    extractedData.push(data);
                    console.log(`Successfully processed ${path_1.default.basename(file)}`);
                }
                catch (error) {
                    console.error(`Error processing ${path_1.default.basename(file)}:`, error);
                }
            }
            if (extractedData.length > 0) {
                await file_utils_1.FileUtils.saveOutputFiles(extractedData, outputsDir);
                console.log(`Successfully generated Excel file with ${extractedData.length} entries`);
            }
            else {
                console.warn("No files were successfully processed");
            }
        }
        catch (error) {
            console.error("Fatal error during processing:", error);
            throw error;
        }
    }
    async processSinglePDF(filePath, outputsDir) {
        const data = await this.pdfExtract.extract(filePath, this.options);
        // await FileUtils.saveDebugData(data, filePath, outputsDir);
        const extractedStrings = target_coordinates_1.default.map((coord) => {
            const strings = data.pages.flatMap((page) => page.content
                .filter((item) => item.x >= coord.xStart &&
                item.x <= coord.xEnd &&
                item.y >= coord.yStart &&
                item.y <= coord.yEnd)
                .map((item) => item.str)
                .filter((str) => str.trim() !== "" && !str.includes("TITLE :")));
            return {
                label: coord.label,
                strings: coord.label === "Nama Gambar" ? [strings.join(" ")] : strings,
            };
        });
        return {
            fileName: path_1.default.basename(filePath),
            data: extractedStrings,
        };
    }
}
exports.PDFService = PDFService;
