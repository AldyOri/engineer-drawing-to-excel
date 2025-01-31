import { PDFExtract, PDFExtractOptions } from "pdf.js-extract";
import { ExtractedData } from "../interfaces/extracted-data";
import targetCoordinates from "../target-coordinates";
import { FileUtils } from "../utils/file-utils";
import path from "path";

export class PDFService {
  private pdfExtract: PDFExtract;
  private options: PDFExtractOptions;

  constructor() {
    this.pdfExtract = new PDFExtract();
    this.options = {
      firstPage: 1,
      lastPage: 1,
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
    const data = await this.pdfExtract.extract(filePath, this.options);
    // await FileUtils.saveDebugData(data, filePath, outputsDir);

    const extractedStrings = targetCoordinates.map((coord) => {
      const strings = data.pages.flatMap((page) =>
        page.content
          .filter(
            (item) =>
              item.x >= coord.xStart &&
              item.x <= coord.xEnd &&
              item.y >= coord.yStart &&
              item.y <= coord.yEnd
          )
          .map((item) => item.str)
          .filter((str) => str.trim() !== "" && !str.includes("TITLE :"))
      );
      return {
        label: coord.label,
        strings: coord.label === "Nama Gambar" ? [strings.join(" ")] : strings,
      };
    });

    return {
      fileName: path.basename(filePath),
      data: extractedStrings,
    };
  }
}
