"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = void 0;
const constants_1 = require("../../constants/constants");
const fs_1 = __importDefault(require("fs"));
const uploadFiles = async (req, res) => {
    try {
        // Ensure uploads directory exists
        if (!fs_1.default.existsSync(constants_1.UPLOADS_DIR_V1)) {
            fs_1.default.mkdirSync(constants_1.UPLOADS_DIR_V1, { recursive: true });
            console.log(`Created uploads directory at ${constants_1.UPLOADS_DIR_V1}`);
        }
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({
                message: "No files uploaded",
                error: "Please upload at least one PDF file",
            });
            return;
        }
        // Validate files
        const files = req.files;
        const invalidFiles = files.filter((file) => !file.mimetype.includes("pdf"));
        if (invalidFiles.length > 0) {
            res.status(400).json({
                message: "Invalid file type",
                error: "Only PDF files are allowed",
                files: invalidFiles.map((f) => f.originalname),
            });
            return;
        }
        const fileNames = files.map((file) => file.filename);
        console.log(`Successfully uploaded ${fileNames.length} files`);
        res.status(200).json({
            message: "Files uploaded successfully",
            files: fileNames,
        });
    }
    catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({
            message: "Error uploading files",
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};
exports.uploadFiles = uploadFiles;
