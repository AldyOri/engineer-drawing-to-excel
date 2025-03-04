import { Request, Response } from "express";
import { OUTPUTS_DIR_V2, UPLOADS_DIR_V2 } from "../../constants/constants";
import { FileUtils } from "../../utils/file-utils";
import path from "path";
import { existsSync } from "fs";
import { generateExcel } from "../../services/v2/exceljs-service";
import fs from "fs/promises";

export const downloadExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const jsonPath = path.join(OUTPUTS_DIR_V2, "extractedData.json");

    if (!existsSync(jsonPath)) {
      res.status(404).json({
        message: "Extracted data not found",
        error: "Process PDF files first",
      });
      return;
    }

    // Read the JSON data
    const jsonData = JSON.parse(await fs.readFile(jsonPath, "utf-8"));

    // Generate Excel file
    const excelBuffer = await generateExcel(jsonData);

    // Set response headers
    const fileName = `result.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Send the excel file
    res.send(excelBuffer);

    // Clean up after successful download
    try {
      await FileUtils.clearDirectory(UPLOADS_DIR_V2);
      await FileUtils.clearDirectory(OUTPUTS_DIR_V2);
      console.log(
        "Cleared uploads and outputs directories after successful download"
      );
    } catch (cleanupError) {
      console.error("Error clearing directories:", cleanupError);
    }
  } catch (error) {
    console.error("Error in download:", error);
    res.status(500).json({
      message: "Error downloading file",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
