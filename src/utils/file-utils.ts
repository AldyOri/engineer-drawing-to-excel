import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { ExtractedData } from "../interfaces/extracted-data";
import { generateExcel } from "../services/exceljs-service";

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
    const debugFileName = `debug_${path.basename(
      filePath,
      ".pdf"
    )}.json`;

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

    const files = await fs.readdir(dirPath);
    await Promise.all(files.map((file) => fs.unlink(path.join(dirPath, file))));
    console.log(`Cleared directory: ${dirPath}`);
  }

  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }
}
