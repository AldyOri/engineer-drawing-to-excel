import {
  PDFDocument,
  PDFDict,
  PDFArray,
  PDFString,
  PDFName,
  PDFNumber,
  StandardFonts,
  rgb,
  PDFPage,
  PDFRef,
} from "pdf-lib";
import fs from "fs/promises";
import path from "path";

// important pdf layers: ["0", "AM_0", "Border (ISO)", "Title (ISO)", "Hatch (ISO)"]

interface PDFAnnotation {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  type: string;
}

export class PDFUtils {
  private static async extractAnnotations(
    page: PDFPage
  ): Promise<PDFAnnotation[]> {
    const annotations: PDFAnnotation[] = [];
    const annots = page.node.lookup(PDFName.of("Annots"));

    console.log("Extracting annotations...");

    if (!annots) {
      console.log("No annotations found in page");
      return annotations;
    }

    if (!(annots instanceof PDFArray)) {
      console.log("Annotations not in expected format (PDFArray)");
      return annotations;
    }

    const annotArray = annots.asArray();
    console.log(`Found ${annotArray.length} annotations`);

    for (const annot of annotArray) {
      try {
        // Resolve annotation reference
        let resolvedAnnot =
          annot instanceof PDFRef ? page.doc.context.lookup(annot) : annot;

        if (!(resolvedAnnot instanceof PDFDict)) {
          console.log(
            "Annotation not in expected format:",
            resolvedAnnot?.constructor.name
          );
          continue;
        }

        // Get annotation properties
        const contents = resolvedAnnot.lookup(PDFName.of("Contents"));
        const rect = resolvedAnnot.lookup(PDFName.of("Rect"));
        const subtype = resolvedAnnot.lookup(PDFName.of("Subtype"));
        const appearance = resolvedAnnot.lookup(PDFName.of("AP"));

        let textContent = "";

        // Handle different annotation types
        if (subtype instanceof PDFName) {
          const subtypeStr = subtype.toString();
          console.log("Processing annotation type:", subtypeStr);

          if (subtypeStr === "/Stamp") {
            // For stamp annotations, try multiple sources for content
            const stampSources = [
              { key: "Contents", value: contents },
              { key: "Name", value: resolvedAnnot.lookup(PDFName.of("Name")) },
              { key: "T", value: resolvedAnnot.lookup(PDFName.of("T")) },
              { key: "RC", value: resolvedAnnot.lookup(PDFName.of("RC")) },
            ];

            // Try each source until we find content
            for (const source of stampSources) {
              if (source.value instanceof PDFString) {
                textContent = source.value.asString();
                console.log(`Found stamp text in ${source.key}:`, textContent);
                break;
              }
            }

            // If no text found, try to get content from appearance stream
            if (!textContent && appearance instanceof PDFDict) {
              const normal = appearance.lookup(PDFName.of("N"));
              if (normal instanceof PDFDict) {
                const stream = normal.lookup(PDFName.of("Stream"));
                if (stream) {
                  textContent = `Stamp: ${normal.toString().substring(0, 50)}`;
                  console.log("Using appearance stream for stamp content");
                }
              }
            }
          } else {
            // Handle other annotation types
            if (contents instanceof PDFString) {
              textContent = contents.asString();
            }
          }
        }

        // If still no content, try alternate fields
        if (!textContent) {
          const alternateFields = ["V", "TU", "TM", "DS", "CA"];
          for (const field of alternateFields) {
            const value = resolvedAnnot.lookup(PDFName.of(field));
            if (value instanceof PDFString) {
              textContent = value.asString();
              console.log(
                `Found text in alternate field ${field}:`,
                textContent
              );
              break;
            }
          }
        }

        // Only proceed if we have both text content and valid coordinates
        if (textContent && rect instanceof PDFArray) {
          const coords = rect.asArray();
          if (coords.length >= 4) {
            const x = coords[0] instanceof PDFNumber ? coords[0].asNumber() : 0;
            const y = coords[1] instanceof PDFNumber ? coords[1].asNumber() : 0;

            // For stamps, also store the width and height
            const width =
              coords[2] instanceof PDFNumber
                ? coords[2].asNumber() - x
                : undefined;
            const height =
              coords[3] instanceof PDFNumber
                ? coords[3].asNumber() - y
                : undefined;

            console.log(
              `Adding annotation: "${textContent}" at (${x},${y})`,
              width && height ? `size: ${width}x${height}` : ""
            );

            annotations.push({
              text: textContent,
              x,
              y,
              width,
              height,
              type: subtype?.toString() || "unknown",
            });
          }
        }
      } catch (error) {
        console.error("Error processing annotation:", error);
      }
    }

    console.log(`Successfully extracted ${annotations.length} annotations`);
    return annotations;
  }
  public static async createCroppedPDF(
    sourcePath: string,
    outputPath: string
  ): Promise<void> {
    if (!sourcePath || !outputPath) {
      throw new Error("Source and output paths are required");
    }

    try {
      const sourceBytes = await fs.readFile(sourcePath);
      const sourceDoc = await PDFDocument.load(sourceBytes, {
        ignoreEncryption: true,
      });
      const newDoc = await PDFDocument.create();

      // Get only the first page
      const [sourcePage] = sourceDoc.getPages();
      // await this.dumpPDFStructure(sourcePage); // Add this line before extraction
      let { width, height } = sourcePage.getSize();

      // Extract annotations before creating new page
      const annotations = await this.extractAnnotations(sourcePage);

      // Create new page with half height
      const newPage = newDoc.addPage([width, height / 2]);

      // Embed and draw bottom half of the page
      const embeddedPage = await newDoc.embedPage(sourcePage, {
        top: height / 2, // Start from middle
        bottom: 0, // To bottom
        left: 0, // Full width
        right: width, // Full width
      });

      // Draw the embedded content
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height / 2,
      });

      // Add annotations as text
      const font = await newDoc.embedFont(StandardFonts.HelveticaBold); // Use bold font
      const fontSize = 7; // Increased font size
      const xOffset = 5; // Move text right by 5 points
      const yOffset = 5; // Move text up by 5 points

      for (const annot of annotations) {
        // Only include annotations from bottom half
        if (annot.y <= height / 2) {
          // Draw white background rectangle first
          newPage.drawRectangle({
            x: annot.x + xOffset - 2,
            y: annot.y + yOffset - 2,
            width: Math.min(
              newPage.getWidth() - annot.x,
              font.widthOfTextAtSize(annot.text, fontSize) + 4
            ),
            height: fontSize + 4,
            color: rgb(1, 1, 1), // White background
            opacity: 1,
          });

          // Draw text on top of background
          newPage.drawText(annot.text, {
            x: annot.x + xOffset,
            y: annot.y + yOffset,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0), // Black text
            maxWidth: width - annot.x,
            lineHeight: fontSize * 1.2,
          });
        }
      }

      const newPdfBytes = await newDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, newPdfBytes);
      console.log(
        `Created cropped PDF at: ${outputPath} with ${annotations.length} annotations`
      );
    } catch (error) {
      console.error("Error creating cropped PDF:", error);
      throw error;
    }
  }

  public static async processDirectory(
    inputDir: string,
    outputDir: string
  ): Promise<void> {
    try {
      // Get all PDF files in directory
      const files = await fs.readdir(inputDir);
      const pdfFiles = files.filter((file) =>
        file.toLowerCase().endsWith(".pdf")
      );

      // Process each PDF
      for (const pdfFile of pdfFiles) {
        const sourcePath = path.join(inputDir, pdfFile);
        const outputPath = path.join(outputDir, `cropped_${pdfFile}`);

        await PDFUtils.createCroppedPDF(sourcePath, outputPath);
      }

      console.log(`Processed ${pdfFiles.length} PDF files`);
    } catch (error) {
      console.error("Error processing directory:", error);
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

      for (const pdfFile of pdfFiles) {
        const sourcePath = path.join(inputDir, pdfFile);
        const outputPath = path.join(outputDir, `cropped_${pdfFile}`);
        await this.createCroppedPDF(sourcePath, outputPath);
      }

      console.log(`Processed ${pdfFiles.length} PDF files`);
    } catch (error) {
      console.error("Error processing PDFs:", error);
      throw error;
    }
  }
}

// private static async writeDebugInfo(
//   filename: string,
//   data: any
// ): Promise<void> {
//   const debugDir = path.join("outputs", "v2", "debug");
//   const debugPath = path.join(debugDir, `${filename}.json`);

//   try {
//     await fs.mkdir(debugDir, { recursive: true });
//     await fs.writeFile(debugPath, JSON.stringify(data, null, 2));
//     console.log(`Debug info written to ${debugPath}`);
//   } catch (error) {
//     console.error("Failed to write debug info:", error);
//   }
// }

// private static async dumpPDFStructure(page: PDFPage): Promise<void> {
//   console.log("\nPDF Structure Analysis:");

//   const dict = page.node;
//   const debugData: any = {
//     timestamp: new Date().toISOString(),
//     pageKeys: Object.keys(dict),
//     annotations: [],
//   };

//   const annots = dict.lookup(PDFName.of("Annots"));
//   if (annots instanceof PDFArray) {
//     console.log("\nDetailed Annotation Analysis:");
//     const annotations = annots.asArray();

//     for (let i = 0; i < annotations.length; i++) {
//       const annot = annotations[i];
//       console.log(`\nAnnotation ${i + 1}:`);

//       const annotDebug: any = {
//         index: i + 1,
//         type: annot.constructor.name,
//         details: {},
//       };

//       if (annot instanceof PDFDict) {
//         const keys = Array.from(annot.keys()).map((k) => k.toString());
//         annotDebug.keys = keys;

//         keys.forEach((key) => {
//           const value = annot.lookup(PDFName.of(key));
//           annotDebug.details[key] = value?.toString() || null;
//         });
//       } else if (annot instanceof PDFRef) {
//         annotDebug.reference = annot.toString();
//         const resolved = page.doc.context.lookup(annot);
//         annotDebug.resolvedType = resolved?.constructor.name;
//       }

//       debugData.annotations.push(annotDebug);
//     }
//   }

//   // Write debug info to file
//   const filename = `pdf_structure_${Date.now()}`;
//   await this.writeDebugInfo(filename, debugData);
// }
