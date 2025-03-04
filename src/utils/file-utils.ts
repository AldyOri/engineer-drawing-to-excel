import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { ExtractedData } from "../interfaces/v1/extracted-data";
import { generateExcel } from "../services/v1/exceljs-service";

export class FileUtils {
  static async getPDFFiles(directory: string): Promise<string[]> {
    const files = await fs.readdir(directory);
    return files
      .filter((file) => file.toLowerCase().endsWith(".pdf"))
      .map((file) => path.join(directory, file));
  }

  static async saveDebugData(
    data: unknown,
    filePath: string,
    outputsDir: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:]/g, "-");
    const debugFileName = `debug_${path.basename(filePath, ".pdf")}.json`;

    await FileUtils.ensureDirectoryExists(outputsDir);
    await fs.writeFile(
      path.join(outputsDir, debugFileName),
      JSON.stringify(data, null, 2)
    );
    console.log(`Debug data saved to ${debugFileName}`);
  }

  static async saveOutputFiles(
    extractedData: ExtractedData[],
    outputsDir: string
  ): Promise<void> {
    await FileUtils.ensureDirectoryExists(outputsDir);

    await fs.writeFile(
      path.join(outputsDir, "extractedStrings.json"),
      JSON.stringify(extractedData, null, 2)
    );

    const excelBuffer = await generateExcel(extractedData);
    await fs.writeFile(path.join(outputsDir, "result.xlsx"), excelBuffer);
  }

  static async clearDirectory(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) return;

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);

        try {
          const stats = await fs.stat(filePath);

          if (stats.isDirectory()) {
            // First recursively clear the subdirectory
            await this.clearDirectory(filePath);
            // Then remove the empty directory
            try {
              await fs.rmdir(filePath);
            } catch (rmdirError: any) {
              console.warn(
                `Could not remove directory ${filePath}: ${rmdirError.message}`
              );
            }
          } else {
            // Remove file
            try {
              await fs.unlink(filePath);
            } catch (unlinkError: any) {
              console.warn(
                `Could not delete file ${filePath}: ${unlinkError.message}`
              );
            }
          }
        } catch (statError: any) {
          console.warn(`Could not access ${filePath}: ${statError.message}`);
        }
      }

      console.log(`Cleared directory: ${dirPath}`);
    } catch (error: any) {
      console.error(`Error clearing directory ${dirPath}: ${error.message}`);
    }
  }

  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }
}
