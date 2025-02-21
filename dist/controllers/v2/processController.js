"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFiles = void 0;
const constants_1 = require("../../constants/constants");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_utils_1 = require("../../utils/v2/pdf-utils");
const ai_service_1 = require("../../services/v2/ai-service");
const exceljs_service_1 = require("../../services/v2/exceljs-service");
const processFiles = async (req, res) => {
    try {
        // Check if uploads directory exists and has files
        if (!fs_1.default.existsSync(constants_1.UPLOADS_DIR_V2) ||
            fs_1.default.readdirSync(constants_1.UPLOADS_DIR_V2).length === 0) {
            res.status(400).json({
                message: "No files to process",
                error: "Upload PDF files first",
            });
            return;
        }
        // First crop the PDFs
        await pdf_utils_1.PDFUtils.processPDFs(constants_1.UPLOADS_DIR_V2, path_1.default.join(constants_1.UPLOADS_DIR_V2, "copy"));
        // Then process with AI
        const extractedData = await (0, ai_service_1.askAi)();
        // Generate Excel file
        const excelBuffer = await (0, exceljs_service_1.generateExcel)(extractedData);
        // Save Excel file
        // const excelPath = path.join(OUTPUTS_DIR_V2, `processed_drawings_${new Date().toISOString().split('T')[0]}.xlsx`);
        const excelPath = path_1.default.join(constants_1.OUTPUTS_DIR_V2, `result.xlsx`);
        await fs_1.default.promises.writeFile(excelPath, excelBuffer);
        res.status(200).json({
            message: "Files processed successfully",
            outputPath: constants_1.OUTPUTS_DIR_V2,
            jsonPath: path_1.default.join(constants_1.OUTPUTS_DIR_V2, "extractedData.json"),
            excelPath: excelPath,
            //   extractedData,
        });
    }
    catch (error) {
        console.error("Error processing files:", error);
        res.status(500).json({
            message: "Error processing files",
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};
exports.processFiles = processFiles;
