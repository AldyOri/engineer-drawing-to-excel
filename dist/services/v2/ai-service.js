"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAi = void 0;
const constants_1 = require("../../constants/constants");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ai_config_1 = require("../../config/ai-config");
async function processBatchConcurrently(batchFiles) {
    console.log(`Processing batch of ${batchFiles.length} files...`);
    // Create parts array with delimiters between documents
    const parts = [];
    for (const file of batchFiles) {
        // Add document delimiter before each document except the first one
        if (parts.length > 0) {
            const delimiterPart = {
                text: constants_1.DOCUMENT_DELIMITER,
            };
            parts.push(delimiterPart);
        }
        // Add the PDF document
        parts.push((0, ai_config_1.fileToGenerativePart)(path_1.default.join(constants_1.UPLOADS_DIR_V2, "copy", file), "application/pdf"));
    }
    // Add the prompt at the end
    const promptPart = {
        text: constants_1.AI_PROMPT,
    };
    parts.push(promptPart);
    const result = await ai_config_1.model.generateContent(parts);
    const batchResponse = JSON.parse(result.response.text());
    console.log(`Batch completed`);
    return batchResponse;
}
async function processAllBatches(files, batchSize = 5) {
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
    }
    console.log(`Processing ${batches.length} batches concurrently...`);
    const batchResults = await Promise.all(batches.map((batch) => processBatchConcurrently(batch)));
    return batchResults.flat();
}
async function askAi() {
    const startTime = performance.now();
    const files = fs_1.default
        .readdirSync(path_1.default.join(constants_1.UPLOADS_DIR_V2, "copy"))
        .filter((file) => file.endsWith(".pdf"));
    console.log(`Total files to process: ${files.length}`);
    try {
        const response = await processAllBatches(files, 5);
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        console.log(`\nAll processing completed in ${duration.toFixed(2)} seconds`);
        console.log(`Average time per file: ${(duration / files.length).toFixed(2)} seconds`);
        await fs_1.default.promises.writeFile(path_1.default.join(constants_1.OUTPUTS_DIR_V2, "extractedData.json"), JSON.stringify(response, null, 2));
        console.log(`\nResults saved to extractedData.json`);
        return response;
    }
    catch (error) {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        console.error(`\nError after ${duration.toFixed(2)} seconds:`, error);
        throw error;
    }
}
exports.askAi = askAi;
