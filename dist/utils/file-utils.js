"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const exceljs_service_1 = require("../services/exceljs-service");
class FileUtils {
    static async getPDFFiles(directory) {
        const files = await promises_1.default.readdir(directory);
        return files
            .filter((file) => file.toLowerCase().endsWith(".pdf"))
            .map((file) => path_1.default.join(directory, file));
    }
    static async saveDebugData(data, filePath, outputsDir) {
        const timestamp = new Date().toISOString().replace(/[:]/g, "-");
        const debugFileName = `debug_${path_1.default.basename(filePath, ".pdf")}.json`;
        await FileUtils.ensureDirectoryExists(outputsDir);
        await promises_1.default.writeFile(path_1.default.join(outputsDir, debugFileName), JSON.stringify(data, null, 2));
        console.log(`Debug data saved to ${debugFileName}`);
    }
    static async saveOutputFiles(extractedData, outputsDir) {
        await FileUtils.ensureDirectoryExists(outputsDir);
        await promises_1.default.writeFile(path_1.default.join(outputsDir, "extractedStrings.json"), JSON.stringify(extractedData, null, 2));
        const excelBuffer = await (0, exceljs_service_1.generateExcel)(extractedData);
        await promises_1.default.writeFile(path_1.default.join(outputsDir, "result.xlsx"), excelBuffer);
    }
    static async clearDirectory(dirPath) {
        if (!(0, fs_1.existsSync)(dirPath))
            return;
        const files = await promises_1.default.readdir(dirPath);
        await Promise.all(files.map((file) => promises_1.default.unlink(path_1.default.join(dirPath, file))));
        console.log(`Cleared directory: ${dirPath}`);
    }
    static async ensureDirectoryExists(dirPath) {
        if (!(0, fs_1.existsSync)(dirPath)) {
            (0, fs_1.mkdirSync)(dirPath, { recursive: true });
        }
    }
}
exports.FileUtils = FileUtils;
