import { Request, Response } from "express";
import { OUTPUTS_DIR, UPLOADS_DIR } from "../constants/constants";
import { PDFService } from "../services/pdf-service";
import fs from "fs";

export const processFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if uploads directory exists and has files
    if (!fs.existsSync(UPLOADS_DIR) || fs.readdirSync(UPLOADS_DIR).length === 0) {
      res.status(400).json({
        message: "No files to process",
        error: "Upload PDF files first"
      });
      return;
    }

    const pdfService = new PDFService();
    const processedFiles = await pdfService.processAllPDFs(UPLOADS_DIR, OUTPUTS_DIR);

    res.status(200).json({
      message: "Files processed successfully",
      outputPath: OUTPUTS_DIR,
      processedFiles
    });
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).json({ 
      message: "Error processing files",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};