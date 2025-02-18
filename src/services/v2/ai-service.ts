import {
  AI_PROMPT,
  DOCUMENT_DELIMITER,
  OUTPUTS_DIR_V2,
  UPLOADS_DIR_V2,
} from "../../constants/constants";
import fs from "fs";
import path from "path";
import { fileToGenerativePart, model } from "../../config/ai-config";
import { Part, TextPart } from "@google/generative-ai";

async function processBatchConcurrently(batchFiles: string[]) {
  console.log(`Processing batch of ${batchFiles.length} files...`);

  // Create parts array with delimiters between documents
  const parts: Part[] = [];

  for (const file of batchFiles) {
    // Add document delimiter before each document except the first one
    if (parts.length > 0) {
      const delimiterPart: TextPart = {
        text: DOCUMENT_DELIMITER,
        // Remove inlineData since it's not needed for text parts
      };
      parts.push(delimiterPart);
    }

    // Add the PDF document
    parts.push(
      await fileToGenerativePart(
        path.join(UPLOADS_DIR_V2, "cropped", file),
        "application/pdf"
      )
    );
  }

  // Add the prompt at the end
  const promptPart: TextPart = {
    text: AI_PROMPT,
    // Remove inlineData since it's not needed for text parts
  };
  parts.push(promptPart);

  const result = await model.generateContent(parts);
  const batchResponse = JSON.parse(result.response.text());

  console.log(`Batch completed`);
  return batchResponse;
}

async function processAllBatches(files: string[], batchSize: number = 5) {
  const batches = [];

  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }

  console.log(`Processing ${batches.length} batches concurrently...`);
  const batchResults = await Promise.all(
    batches.map((batch) => processBatchConcurrently(batch))
  );

  return batchResults.flat();
}

export async function askAi() {
  const startTime = performance.now();

  const files = fs
    .readdirSync(path.join(UPLOADS_DIR_V2, "cropped"))
    .filter((file) => file.endsWith(".pdf"));

  console.log(`Total files to process: ${files.length}`);

  try {
    const response = await processAllBatches(files, 5);

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\nAll processing completed in ${duration.toFixed(2)} seconds`);
    console.log(
      `Average time per file: ${(duration / files.length).toFixed(2)} seconds`
    );

    await fs.promises.writeFile(
      path.join(OUTPUTS_DIR_V2, "extractedData.json"),
      JSON.stringify(response, null, 2)
    );

    console.log(`\nResults saved to extractedData.json`);
    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    console.error(`\nError after ${duration.toFixed(2)} seconds:`, error);
    throw error;
  }
}
