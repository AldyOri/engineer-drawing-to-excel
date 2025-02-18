import { Request, Response } from "express";
import { OUTPUTS_DIR_V2, UPLOADS_DIR_V2 } from "../../constants/constants";
import fs from "fs";
import path from "path";
import { PDFUtils } from "../../utils/v2/pdf-utils";
import { askAi } from "../../services/v2/ai-service";
import { generateExcel } from "../../services/v2/exceljs-service";

export const processFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if uploads directory exists and has files
    if (
      !fs.existsSync(UPLOADS_DIR_V2) ||
      fs.readdirSync(UPLOADS_DIR_V2).length === 0
    ) {
      res.status(400).json({
        message: "No files to process",
        error: "Upload PDF files first",
      });
      return;
    }

    // First crop the PDFs
    await PDFUtils.processPDFs(
      UPLOADS_DIR_V2,
      path.join(UPLOADS_DIR_V2, "cropped")
    );

    // Then process with AI
    const extractedData = await askAi();

    // Generate Excel file
    const excelBuffer = await generateExcel(extractedData);

    // Save Excel file
    // const excelPath = path.join(OUTPUTS_DIR_V2, `processed_drawings_${new Date().toISOString().split('T')[0]}.xlsx`);
    const excelPath = path.join(OUTPUTS_DIR_V2, `result.xlsx`);
    await fs.promises.writeFile(excelPath, excelBuffer);

    res.status(200).json({
      message: "Files processed successfully",
      outputPath: OUTPUTS_DIR_V2,
      jsonPath: path.join(OUTPUTS_DIR_V2, "extractedData.json"),
      excelPath: excelPath,
      //   extractedData,
    });
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).json({
      message: "Error processing files",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
