import { Request, Response } from "express";
import { OUTPUTS_DIR_V1, UPLOADS_DIR_V1 } from "../../constants/constants";
import { FileUtils } from "../../utils/file-utils";
import path from "path";
import { existsSync } from "fs";

export const downloadExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const excelPath = path.join(OUTPUTS_DIR_V1, "result.xlsx");

    if (!existsSync(excelPath)) {
      res.status(404).json({
        message: "Excel file not found",
        error: "Process PDF files first",
      });
      return;
    }

    const fileName = `processed_drawings_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    res.download(excelPath, fileName, async (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).json({
          message: "Error downloading file",
          error: err.message,
        });
        return;
      }

      try {
        await FileUtils.clearDirectory(UPLOADS_DIR_V1);
        await FileUtils.clearDirectory(OUTPUTS_DIR_V1);
        console.log(
          "Cleared uploads and outputs directories after successful download"
        );
      } catch (cleanupError) {
        console.error("Error clearing directories:", cleanupError);
      }
    });
  } catch (error) {
    console.error("Error in download:", error);
    res.status(500).json({
      message: "Error downloading file",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
