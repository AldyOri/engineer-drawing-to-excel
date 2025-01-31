"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFiles = void 0;
const constants_1 = require("../constants/constants");
const pdf_service_1 = require("../services/pdf-service");
const fs_1 = __importDefault(require("fs"));
const processFiles = async (req, res) => {
    try {
        // Check if uploads directory exists and has files
        if (!fs_1.default.existsSync(constants_1.UPLOADS_DIR) || fs_1.default.readdirSync(constants_1.UPLOADS_DIR).length === 0) {
            res.status(400).json({
                message: "No files to process",
                error: "Upload PDF files first"
            });
            return;
        }
        const pdfService = new pdf_service_1.PDFService();
        const processedFiles = await pdfService.processAllPDFs(constants_1.UPLOADS_DIR, constants_1.OUTPUTS_DIR);
        res.status(200).json({
            message: "Files processed successfully",
            outputPath: constants_1.OUTPUTS_DIR,
            processedFiles
        });
    }
    catch (error) {
        console.error("Error processing files:", error);
        res.status(500).json({
            message: "Error processing files",
            error: error instanceof Error ? error.message : "Unknown error occurred"
        });
    }
};
exports.processFiles = processFiles;
