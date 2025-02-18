"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileToGenerativePart = exports.model = exports.genAI = void 0;
const generative_ai_1 = require("@google/generative-ai");
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
exports.genAI = new generative_ai_1.GoogleGenerativeAI(process.env.API_KEY);
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
                description: "Array of valid TYPE codes extracted from the 'TYPE' column in the title block.  Refer to the document for the visual layout.",
                nullable: true,
                items: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "A valid TYPE code extracted from the 'TYPE' column.  Must match a defined valid pattern.",
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
exports.model = exports.genAI.getGenerativeModel({
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
exports.fileToGenerativePart = fileToGenerativePart;
