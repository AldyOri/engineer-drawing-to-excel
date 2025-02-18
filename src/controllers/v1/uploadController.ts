import { Request, Response } from "express";
import { UPLOADS_DIR_V1 } from "../../constants/constants";
import fs from "fs";

interface UploadResponse {
  message: string;
  files?: string[];
  error?: string;
}

export const uploadFiles = async (
  req: Request,
  res: Response<UploadResponse>
): Promise<void> => {
  try {
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR_V1)) {
      fs.mkdirSync(UPLOADS_DIR_V1, { recursive: true });
      console.log(`Created uploads directory at ${UPLOADS_DIR_V1}`);
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        message: "No files uploaded",
        error: "Please upload at least one PDF file",
      });
      return;
    }

    // Validate files
    const files = req.files as Express.Multer.File[];
    const invalidFiles = files.filter((file) => !file.mimetype.includes("pdf"));

    if (invalidFiles.length > 0) {
      res.status(400).json({
        message: "Invalid file type",
        error: "Only PDF files are allowed",
        files: invalidFiles.map((f) => f.originalname),
      });
      return;
    }

    const fileNames = files.map((file) => file.filename);
    console.log(`Successfully uploaded ${fileNames.length} files`);

    res.status(200).json({
      message: "Files uploaded successfully",
      files: fileNames,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({
      message: "Error uploading files",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
