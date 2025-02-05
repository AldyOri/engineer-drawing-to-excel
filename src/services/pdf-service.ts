import { PDFExtract, PDFExtractOptions } from "pdf.js-extract";
import { ExtractedData } from "../interfaces/extracted-data";
import { FileUtils } from "../utils/file-utils";
import path from "path";
import fs from "fs/promises";
import { normalizePDF } from "../utils/pdf-utils";
import { EXTRACTION_CONFIG } from "../config/extraction-config";

export class PDFService {
  private pdfExtract: PDFExtract;
  private options: PDFExtractOptions;

  constructor() {
    this.pdfExtract = new PDFExtract();
    this.options = {
      firstPage: 1,
      lastPage: undefined,
      normalizeWhitespace: true,
    };
  }

  async processAllPDFs(uploadsDir: string, outputsDir: string): Promise<void> {
    try {
      const pdfFiles = await FileUtils.getPDFFiles(uploadsDir);
      console.log(`Found ${pdfFiles.length} PDF files to process`);

      const extractedData: ExtractedData[] = [];
      for (const file of pdfFiles) {
        try {
          console.log(`Processing ${path.basename(file)}...`);
          const data = await this.processSinglePDF(file, outputsDir);
          extractedData.push(data);
          console.log(`Successfully processed ${path.basename(file)}`);
        } catch (error) {
          console.error(`Error processing ${path.basename(file)}:`, error);
        }
      }

      if (extractedData.length > 0) {
        await FileUtils.saveOutputFiles(extractedData, outputsDir);
        console.log(
          `Successfully generated Excel file with ${extractedData.length} entries`
        );
      } else {
        console.warn("No files were successfully processed");
      }
    } catch (error) {
      console.error("Fatal error during processing:", error);
      throw error;
    }
  }

  private async processSinglePDF(
    filePath: string,
    outputsDir: string
  ): Promise<ExtractedData> {
    let tempFile: string | undefined;

    try {
      const normalizedPdfBytes = await normalizePDF(filePath);
      tempFile = path.join(outputsDir, `normalized_${path.basename(filePath)}`);
      await fs.writeFile(tempFile, normalizedPdfBytes);

      const data = await this.pdfExtract.extract(tempFile, this.options);
      await FileUtils.saveDebugData(data, filePath, outputsDir);

      const extractedData = EXTRACTION_CONFIG.map((config) => {
        const strings = [
          ...new Set(
            data.pages[0].content
              .filter((item) => {
                // First check coordinates
                const inZone = config.zones.some(
                  (zone) =>
                    item.x >= zone.xStart &&
                    item.x <= zone.xEnd &&
                    item.y >= zone.yStart &&
                    item.y <= zone.yEnd
                );
                if (!inZone) return false;

                // Then verify if text matches pattern
                const trimmedText = item.str.trim();
                return config.pattern.test(trimmedText);
              })
              .map((item) => item.str.trim())
              .filter((str) => str !== "")
          ),
        ];

        return {
          label: config.label,
          strings,
        };
      });

      return {
        fileName: path.basename(filePath),
        data: extractedData,
      };
    } finally {
      if (tempFile && (await fs.stat(tempFile).catch(() => null))) {
        await fs.unlink(tempFile);
      }
    }
  }
}
