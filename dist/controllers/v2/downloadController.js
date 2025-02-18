"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadExcel = void 0;
const constants_1 = require("../../constants/constants");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const exceljs_service_1 = require("../../services/v2/exceljs-service");
const promises_1 = __importDefault(require("fs/promises"));
const downloadExcel = async (req, res) => {
    try {
        const jsonPath = path_1.default.join(constants_1.OUTPUTS_DIR_V2, "extractedData.json");
        if (!(0, fs_1.existsSync)(jsonPath)) {
            res.status(404).json({
                message: "Extracted data not found",
                error: "Process PDF files first",
            });
            return;
        }
        // Read the JSON data
        const jsonData = JSON.parse(await promises_1.default.readFile(jsonPath, "utf-8"));
        // Generate Excel file
        const excelBuffer = await (0, exceljs_service_1.generateExcel)(jsonData);
        // Set response headers
        const fileName = `result.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        // Send the excel file
        res.send(excelBuffer);
        // Clean up after successful download
        try {
            //   await FileUtils.clearDirectory(UPLOADS_DIR_V2);
            //   await FileUtils.clearDirectory(OUTPUTS_DIR_V2);
            console.log("Cleared uploads and outputs directories after successful download");
        }
        catch (cleanupError) {
            console.error("Error clearing directories:", cleanupError);
        }
    }
    catch (error) {
        console.error("Error in download:", error);
        res.status(500).json({
            message: "Error downloading file",
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};
exports.downloadExcel = downloadExcel;
