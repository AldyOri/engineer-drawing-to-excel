import {
  GoogleGenerativeAI,
  InlineDataPart,
  ResponseSchema,
  SchemaType,
} from "@google/generative-ai";
import "dotenv/config";
import fs from "fs";

export const genAI = new GoogleGenerativeAI(process.env.API_KEY!);

const resSchema: ResponseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    required: [
      "projectName",
      "drawingNumber",
      "title",
      "types",
      "size",
      "sheets",
      "revision",
      "drawingDate",
      "personnel",
      "revisionInfo",
      "isCanceled",
      "cancelationCode",
    ],
    properties: {
      projectName: {
        type: SchemaType.STRING,
        description: "Always null",
        nullable: true,
      },
      drawingNumber: {
        type: SchemaType.STRING,
        description: "Drawing number found in the document (DRAWING NO)",
        nullable: true,
      },
      title: {
        type: SchemaType.STRING,
        description:
          "Title or name of the drawing (TITLE), with all newlines removed and combined into a single line",
        nullable: true,
      },
      types: {
        type: SchemaType.ARRAY,
        description:
          "Array of valid TYPE codes extracted EXCLUSIVELY from the 'TYPE' column in the title block. Only include recognized codes.",
        nullable: true,
        items: {
          type: SchemaType.STRING,
          description:
            "A valid TYPE code extracted from the 'TYPE' column. Must match a defined valid pattern.",
          nullable: true,
        },
      },
      size: {
        type: SchemaType.STRING,
        description: "Size of the drawing (A1, A2, A3, etc.)",
        nullable: true,
      },
      sheets: {
        type: SchemaType.NUMBER,
        description: "Total number of sheets",
        nullable: true,
      },
      revision: {
        type: SchemaType.STRING,
        description: "Revision code (REV)",
        nullable: true,
      },
      drawingDate: {
        type: SchemaType.STRING,
        description: "Drawing date (DATE)",
        nullable: true,
      },
      personnel: {
        type: SchemaType.OBJECT,
        description: "Personnel involved in the drawing",
        required: [
          "drafter",
          "checker",
          "approval",
          "welding",
          "integration",
          "mechanical",
        ],
        properties: {
          drafter: {
            type: SchemaType.STRING,
            description: "Drafter name (REVISED BY)",
            nullable: true,
          },
          checker: {
            type: SchemaType.STRING,
            description: "Checker name (CHECKED BY)",
            nullable: true,
          },
          approval: {
            type: SchemaType.STRING,
            description: "Approver name (APPROVED BY)",
            nullable: true,
          },
          welding: {
            type: SchemaType.STRING,
            description: "Welding responsible (WELDED BY)",
            nullable: true,
          },
          integration: {
            type: SchemaType.STRING,
            description: "Integration responsible (INITIAL)",
            nullable: true,
          },
          mechanical: {
            type: SchemaType.STRING,
            description: "Mechanical system responsible",
            nullable: true,
          },
        },
      },
      revisionInfo: {
        type: SchemaType.STRING,
        description: "Revision information code (REV CONTENTS)",
        nullable: true,
      },
      isCanceled: {
        type: SchemaType.BOOLEAN,
        description:
          "The approval/cancelation status of the drawing, default is false, if the value is true, then the drawing is canceled",
        nullable: false,
      },
      cancelationCode: {
        type: SchemaType.STRING,
        description:
          "The cancelation code of the drawing, if isCanceled false, the value should be null",
        nullable: true,
      },
    },
  },
};

export const model = genAI.getGenerativeModel({
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

export function fileToGenerativePart(
  path: string,
  mimeType: string
): InlineDataPart {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}
