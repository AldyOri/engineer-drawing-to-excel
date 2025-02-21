"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFUtils = void 0;
const node_child_process_1 = require("node:child_process");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../constants/constants");
class PDFUtils {
    static async processWithPython(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            const pythonScript = path_1.default.join(constants_1.PROJECT_ROOT, "scripts/pdf_processor.py");
            const process = (0, node_child_process_1.spawn)("python", [pythonScript, inputPath, outputPath]);
            // Collect stdout
            process.stdout.on("data", (data) => {
                console.log(`Python output:\n ${data}`);
            });
            // Collect stderr
            process.stderr.on("data", (data) => {
                console.error(`Python error: ${data}`);
            });
            // Handle process completion
            process.on("close", (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`Python script exited with code ${code}`));
                }
            });
        });
    }
    static async createCopyPDF(sourcePath, outputPath) {
        if (!sourcePath || !outputPath) {
            throw new Error("Source and output paths are required");
        }
        try {
            await this.processWithPython(sourcePath, outputPath);
        }
        catch (error) {
            console.error("Error processing PDF:", error);
            throw error;
        }
    }
    static async processPDFs(inputDir, outputDir) {
        try {
            const files = await promises_1.default.readdir(inputDir);
            const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));
            // Create output directory if it doesn't exist
            await promises_1.default.mkdir(outputDir, { recursive: true });
            for (const pdfFile of pdfFiles) {
                const sourcePath = path_1.default.join(inputDir, pdfFile);
                const outputPath = path_1.default.join(outputDir, `copyof_${pdfFile}`);
                await this.createCopyPDF(sourcePath, outputPath);
            }
            console.log(`Processed ${pdfFiles.length} PDF files`);
        }
        catch (error) {
            console.error("Error processing PDFs:", error);
            throw error;
        }
    }
}
exports.PDFUtils = PDFUtils;
