import { spawn } from "node:child_process";
import fs from "fs/promises";
import path from "path";
import { PROJECT_ROOT } from "../../constants/constants";

export class PDFUtils {
  private static async processWithPython(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(PROJECT_ROOT, "scripts/pdf_processor.py");

      const process = spawn("python", [pythonScript, inputPath, outputPath]);

      // Collect stdout
      process.stdout.on("data", (data) => {
        console.log(`Python output:\n${data}`);
      });

      // Collect stderr
      process.stderr.on("data", (data) => {
        console.error(`Python error: ${data}`);
      });

      // Handle process completion
      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });
    });
  }

  public static async createCopyPDF(
    sourcePath: string,
    outputPath: string
  ): Promise<void> {
    if (!sourcePath || !outputPath) {
      throw new Error("Source and output paths are required");
    }

    try {
      await this.processWithPython(sourcePath, outputPath);
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw error;
    }
  }

  public static async processPDFs(
    inputDir: string,
    outputDir: string
  ): Promise<void> {
    try {
      const files = await fs.readdir(inputDir);
      const pdfFiles = files.filter((file) =>
        file.toLowerCase().endsWith(".pdf")
      );

      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });

      for (const pdfFile of pdfFiles) {
        const sourcePath = path.join(inputDir, pdfFile);
        const outputPath = path.join(outputDir, `copyof_${pdfFile}`);
        await this.createCopyPDF(sourcePath, outputPath);
      }

      console.log(`Processed ${pdfFiles.length} PDF files`);
    } catch (error) {
      console.error("Error processing PDFs:", error);
      throw error;
    }
  }
}
