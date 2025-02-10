"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdf_js_extract_1 = require("pdf.js-extract");
const file_utils_1 = require("../utils/file-utils");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const pdf_utils_1 = require("../utils/pdf-utils");
const extraction_config_1 = require("../config/extraction-config");
class PDFService {
    constructor() {
        this.pdfExtract = new pdf_js_extract_1.PDFExtract();
        this.options = {
            firstPage: 1,
            lastPage: undefined,
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
        let tempFile;
        try {
            const normalizedPdfBytes = await (0, pdf_utils_1.normalizePDF)(filePath);
            tempFile = path_1.default.join(outputsDir, `normalized_${path_1.default.basename(filePath)}`);
            await promises_1.default.writeFile(tempFile, normalizedPdfBytes);
            const data = await this.pdfExtract.extract(tempFile, this.options);
            const origin = this.detectOrigin(data);
            // await FileUtils.saveDebugData(data, filePath, outputsDir);
            const extractedData = extraction_config_1.EXTRACTION_CONFIG.map((config) => {
                if (config.label === "Sheet") {
                    return {
                        label: config.label,
                        strings: [data.pages.length.toString()],
                    };
                }
                // Filter zones to only use those matching detected origin
                const activeZones = config.zones.filter((zone) => zone.origin === origin);
                if (!activeZones.length && config.zones.length) {
                    activeZones.push(config.zones[0]); // Use first zone if none match
                }
                const strings = [
                    ...new Set(data.pages[0].content
                        .filter((item) => {
                        // First check coordinates
                        const inZone = activeZones.some((zone) => item.x >= zone.xStart &&
                            item.x <= zone.xEnd &&
                            item.y >= zone.yStart &&
                            item.y <= zone.yEnd);
                        if (!inZone)
                            return false;
                        // Then verify if text matches pattern
                        const trimmedText = item.str.trim();
                        return (config.pattern.test(trimmedText) &&
                            (!config.excludePattern ||
                                !config.excludePattern.test(trimmedText)));
                    })
                        .map((item) => item.str.trim())
                        .filter((str) => str !== "")),
                ];
                return {
                    label: config.label,
                    strings,
                };
            });
            return {
                fileName: path_1.default.basename(filePath),
                data: extractedData,
            };
        }
        finally {
            if (tempFile && (await promises_1.default.stat(tempFile).catch(() => null))) {
                await promises_1.default.unlink(tempFile);
            }
        }
    }
    detectOrigin(data) {
        // Find text starting with "DITTEK"
        const dittekItem = data.pages[0].content.find((item) => item.str.trim().startsWith("DITTEK"));
        if (!dittekItem) {
            return "top-left"; // Default if not found
        }
        const { x, y } = dittekItem;
        const threshold = 100; // Adjust this value based on your needs
        // Check position relative to page dimensions
        const isLeftSide = x < threshold;
        const isBottomSide = y < threshold;
        if (isLeftSide && isBottomSide)
            return "bottom-left";
        if (!isLeftSide && isBottomSide)
            return "bottom-right";
        if (isLeftSide && !isBottomSide)
            return "top-left";
        return "top-right";
    }
}
exports.PDFService = PDFService;
