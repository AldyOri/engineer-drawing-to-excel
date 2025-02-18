"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadExcel = void 0;
const constants_1 = require("../../constants/constants");
const file_utils_1 = require("../../utils/file-utils");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const downloadExcel = async (req, res) => {
    try {
        const excelPath = path_1.default.join(constants_1.OUTPUTS_DIR_V1, "result.xlsx");
        if (!(0, fs_1.existsSync)(excelPath)) {
            res.status(404).json({
                message: "Excel file not found",
                error: "Process PDF files first",
            });
            return;
        }
        const fileName = `processed_drawings_${new Date().toISOString().split("T")[0]}.xlsx`;
        res.download(excelPath, fileName, async (err) => {
            if (err) {
                console.error("Error downloading file:", err);
                res.status(500).json({
                    message: "Error downloading file",
                    error: err.message,
                });
                return;
            }
            try {
                await file_utils_1.FileUtils.clearDirectory(constants_1.UPLOADS_DIR_V1);
                await file_utils_1.FileUtils.clearDirectory(constants_1.OUTPUTS_DIR_V1);
                console.log("Cleared uploads and outputs directories after successful download");
            }
            catch (cleanupError) {
                console.error("Error clearing directories:", cleanupError);
            }
        });
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
