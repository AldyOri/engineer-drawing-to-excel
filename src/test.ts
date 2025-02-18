import "dotenv/config";
import {
  GoogleGenerativeAI,
  SchemaType,
  ResponseSchema,
} from "@google/generative-ai";
import {
  AI_PROMPT,
  OUTPUTS_DIR_V2,
  UPLOADS_DIR_V2,
} from "./constants/constants";
import path, { join } from "path";
import fs from "fs";
import { PDFUtils } from "./utils/v2/pdf-utils";

const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
const resSchema: ResponseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    required: ["drawingNumber"],
    properties: {
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
        description: "Type code of the drawing located above TYPE cell",
        nullable: true,
        items: {
          type: SchemaType.STRING,
          description: "Type code of the drawing located above TYPE cell",
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

function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

async function processBatchConcurrently(batchFiles: string[]) {
  console.log(`Processing batch of ${batchFiles.length} files...`);

  const pdfParts = batchFiles.map((file) =>
    fileToGenerativePart(
      join(UPLOADS_DIR_V2, "cropped", file),
      "application/pdf"
    )
  );

  const result = await model.generateContent([...pdfParts, AI_PROMPT]);
  const batchResponse = JSON.parse(result.response.text());

  console.log(`Batch completed`);
  return batchResponse;
}

async function processAllBatches(files: string[], batchSize: number = 5) {
  const batches = [];

  // Split files into batches
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }

  console.log(`Processing ${batches.length} batches concurrently...`);

  // Process all batches concurrently
  const batchResults = await Promise.all(
    batches.map((batch) => processBatchConcurrently(batch))
  );

  // Flatten results from all batches
  return batchResults.flat();
}

async function askAi() {
  const startTime = performance.now();

  const files = fs
    .readdirSync(join(UPLOADS_DIR_V2, "cropped"))
    .filter((file) => file.endsWith(".pdf"));

  console.log(`Total files to process: ${files.length}`);

  try {
    const response = await processAllBatches(files, 5); // Process 5 files at a time

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\nAll processing completed in ${duration.toFixed(2)} seconds`);
    console.log(
      `Average time per file: ${(duration / files.length).toFixed(2)} seconds`
    );

    fs.writeFileSync(
      join(OUTPUTS_DIR_V2, "extractedData.json"),
      JSON.stringify(response, null, 2)
    );

    console.log(`\nResults saved to extractedData.json`);
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    console.error(`\nError after ${duration.toFixed(2)} seconds:`, error);
  }
}

PDFUtils.processPDFs(UPLOADS_DIR_V2, path.join(UPLOADS_DIR_V2, "/cropped"));
// askAi();

// to do :
// improve promt for each file
// made the request into batch, because the output token limit are only 8192 token
