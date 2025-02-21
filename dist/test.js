"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const generative_ai_1 = require("@google/generative-ai");
const constants_1 = require("./constants/constants");
const path_1 = __importStar(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdf_utils_1 = require("./utils/v2/pdf-utils");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.API_KEY);
const resSchema = {
    type: generative_ai_1.SchemaType.ARRAY,
    items: {
        type: generative_ai_1.SchemaType.OBJECT,
        required: ["drawingNumber"],
        properties: {
            drawingNumber: {
                type: generative_ai_1.SchemaType.STRING,
                description: "Drawing number found in the document (DRAWING NO)",
                nullable: true,
            },
            title: {
                type: generative_ai_1.SchemaType.STRING,
                description: "Title or name of the drawing (TITLE), with all newlines removed and combined into a single line",
                nullable: true,
            },
            types: {
                type: generative_ai_1.SchemaType.ARRAY,
                description: "Type code of the drawing located above TYPE cell",
                nullable: true,
                items: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "Type code of the drawing located above TYPE cell",
                    nullable: true,
                },
            },
            size: {
                type: generative_ai_1.SchemaType.STRING,
                description: "Size of the drawing (A1, A2, A3, etc.)",
                nullable: true,
            },
            sheets: {
                type: generative_ai_1.SchemaType.NUMBER,
                description: "Total number of sheets",
                nullable: true,
            },
            revision: {
                type: generative_ai_1.SchemaType.STRING,
                description: "Revision code (REV)",
                nullable: true,
            },
            drawingDate: {
                type: generative_ai_1.SchemaType.STRING,
                description: "Drawing date (DATE)",
                nullable: true,
            },
            personnel: {
                type: generative_ai_1.SchemaType.OBJECT,
                description: "Personnel involved in the drawing",
                properties: {
                    drafter: {
                        type: generative_ai_1.SchemaType.STRING,
                        description: "Drafter name (REVISED BY)",
                        nullable: true,
                    },
                    checker: {
                        type: generative_ai_1.SchemaType.STRING,
                        description: "Checker name (CHECKED BY)",
                        nullable: true,
                    },
                    approval: {
                        type: generative_ai_1.SchemaType.STRING,
                        description: "Approver name (APPROVED BY)",
                        nullable: true,
                    },
                    welding: {
                        type: generative_ai_1.SchemaType.STRING,
                        description: "Welding responsible (WELDED BY)",
                        nullable: true,
                    },
                    integration: {
                        type: generative_ai_1.SchemaType.STRING,
                        description: "Integration responsible (INITIAL)",
                        nullable: true,
                    },
                    mechanical: {
                        type: generative_ai_1.SchemaType.STRING,
                        description: "Mechanical system responsible",
                        nullable: true,
                    },
                },
            },
            revisionInfo: {
                type: generative_ai_1.SchemaType.STRING,
                description: "Revision information code (REV CONTENTS)",
                nullable: true,
            },
        },
    },
};
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 1,
        responseMimeType: "application/json",
        responseSchema: resSchema,
        maxOutputTokens: 8192,
    },
});
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs_1.default.readFileSync(path)).toString("base64"),
            mimeType,
        },
    };
}
async function processBatchConcurrently(batchFiles) {
    console.log(`Processing batch of ${batchFiles.length} files...`);
    const pdfParts = batchFiles.map((file) => fileToGenerativePart((0, path_1.join)(constants_1.UPLOADS_DIR_V2, "cropped", file), "application/pdf"));
    const result = await model.generateContent([...pdfParts, constants_1.AI_PROMPT]);
    const batchResponse = JSON.parse(result.response.text());
    console.log(`Batch completed`);
    return batchResponse;
}
async function processAllBatches(files, batchSize = 5) {
    const batches = [];
    // Split files into batches
    for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
    }
    console.log(`Processing ${batches.length} batches concurrently...`);
    // Process all batches concurrently
    const batchResults = await Promise.all(batches.map((batch) => processBatchConcurrently(batch)));
    // Flatten results from all batches
    return batchResults.flat();
}
async function askAi() {
    const startTime = performance.now();
    const files = fs_1.default
        .readdirSync((0, path_1.join)(constants_1.UPLOADS_DIR_V2, "cropped"))
        .filter((file) => file.endsWith(".pdf"));
    console.log(`Total files to process: ${files.length}`);
    try {
        const response = await processAllBatches(files, 5); // Process 5 files at a time
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        console.log(`\nAll processing completed in ${duration.toFixed(2)} seconds`);
        console.log(`Average time per file: ${(duration / files.length).toFixed(2)} seconds`);
        fs_1.default.writeFileSync((0, path_1.join)(constants_1.OUTPUTS_DIR_V2, "extractedData.json"), JSON.stringify(response, null, 2));
        console.log(`\nResults saved to extractedData.json`);
    }
    catch (error) {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        console.error(`\nError after ${duration.toFixed(2)} seconds:`, error);
    }
}
pdf_utils_1.PDFUtils.processPDFs(constants_1.UPLOADS_DIR_V2, path_1.default.join(constants_1.UPLOADS_DIR_V2, "/cropped"));
// askAi();
// to do :
// improve promt for each file
// made the request into batch, because the output token limit are only 8192 token
