"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFUtils = void 0;
const pdf_lib_1 = require("pdf-lib");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class PDFUtils {
    static async extractAnnotations(page) {
        const annotations = [];
        const annots = page.node.lookup(pdf_lib_1.PDFName.of("Annots"));
        console.log("Extracting annotations...");
        if (!annots) {
            console.log("No annotations found in page");
            return annotations;
        }
        if (!(annots instanceof pdf_lib_1.PDFArray)) {
            console.log("Annotations not in expected format (PDFArray)");
            return annotations;
        }
        const annotArray = annots.asArray();
        console.log(`Found ${annotArray.length} annotations`);
        for (const annot of annotArray) {
            try {
                // Always try to resolve the reference first
                let resolvedAnnot;
                if (annot instanceof pdf_lib_1.PDFRef) {
                    resolvedAnnot = page.doc.context.lookup(annot);
                    console.log("Resolved reference:", annot.toString());
                }
                else {
                    resolvedAnnot = annot;
                }
                if (!(resolvedAnnot instanceof pdf_lib_1.PDFDict)) {
                    console.log("Resolved annotation not in expected format:", resolvedAnnot?.constructor.name);
                    continue;
                }
                // Get annotation properties with detailed logging
                const contents = resolvedAnnot.lookup(pdf_lib_1.PDFName.of("Contents"));
                const rect = resolvedAnnot.lookup(pdf_lib_1.PDFName.of("Rect"));
                const subtype = resolvedAnnot.lookup(pdf_lib_1.PDFName.of("Subtype"));
                console.log("Annotation details:", {
                    subtype: subtype?.toString(),
                    hasContents: !!contents,
                    hasRect: !!rect,
                    rawContents: contents?.toString(),
                    rawRect: rect?.toString(),
                });
                // Try to get text content from various sources
                let textContent = "";
                // Check Contents field first
                if (contents instanceof pdf_lib_1.PDFString) {
                    textContent = contents.asString();
                }
                // If no content found, try alternate fields
                if (!textContent) {
                    // Expanded list of possible field names
                    const alternateFields = [
                        // "T", // Username org yang nulis comment (gaperlu)
                        "V",
                        "TU",
                        "TM", // Basic text fields
                        "Contents",
                        "RC", // Rich text and contents
                        "DS",
                        "CA", // Default style and appearance
                        "DA",
                        "AC", // Default appearance and action
                    ];
                    for (const field of alternateFields) {
                        const value = resolvedAnnot.lookup(pdf_lib_1.PDFName.of(field));
                        if (value instanceof pdf_lib_1.PDFString) {
                            textContent = value.asString();
                            console.log(`Found text in field: ${field} = "${textContent}"`);
                            break;
                        }
                    }
                }
                if (!textContent) {
                    console.log("No text content found in resolved annotation");
                    continue;
                }
                // Parse coordinates
                if (rect instanceof pdf_lib_1.PDFArray) {
                    const coords = rect.asArray();
                    if (coords.length >= 4) {
                        // PDF coordinates: [llx, lly, urx, ury]
                        const x = coords[0] instanceof pdf_lib_1.PDFNumber ? coords[0].asNumber() : 0;
                        const y = coords[1] instanceof pdf_lib_1.PDFNumber ? coords[1].asNumber() : 0;
                        console.log(`Adding annotation: "${textContent}" at (${x},${y})`);
                        annotations.push({ text: textContent, x, y });
                    }
                    else {
                        console.log("Invalid rectangle coordinates", coords);
                    }
                }
            }
            catch (error) {
                console.error("Error processing annotation:", error);
            }
        }
        console.log(`Successfully extracted ${annotations.length} annotations`);
        return annotations;
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
    static async createCroppedPDF(sourcePath, outputPath) {
        if (!sourcePath || !outputPath) {
            throw new Error("Source and output paths are required");
        }
        try {
            const sourceBytes = await promises_1.default.readFile(sourcePath);
            const sourceDoc = await pdf_lib_1.PDFDocument.load(sourceBytes, {
                ignoreEncryption: true,
            });
            const newDoc = await pdf_lib_1.PDFDocument.create();
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
            const font = await newDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold); // Use bold font
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
                        width: Math.min(newPage.getWidth() - annot.x, font.widthOfTextAtSize(annot.text, fontSize) + 4),
                        height: fontSize + 4,
                        color: (0, pdf_lib_1.rgb)(1, 1, 1), // White background
                        opacity: 1,
                    });
                    // Draw text on top of background
                    newPage.drawText(annot.text, {
                        x: annot.x + xOffset,
                        y: annot.y + yOffset,
                        size: fontSize,
                        font: font,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0), // Black text
                        maxWidth: width - annot.x,
                        lineHeight: fontSize * 1.2,
                    });
                }
            }
            const newPdfBytes = await newDoc.save({
                useObjectStreams: false,
                addDefaultPage: false,
            });
            await promises_1.default.mkdir(path_1.default.dirname(outputPath), { recursive: true });
            await promises_1.default.writeFile(outputPath, newPdfBytes);
            console.log(`Created cropped PDF at: ${outputPath} with ${annotations.length} annotations`);
        }
        catch (error) {
            console.error("Error creating cropped PDF:", error);
            throw error;
        }
    }
    static async processDirectory(inputDir, outputDir) {
        try {
            // Get all PDF files in directory
            const files = await promises_1.default.readdir(inputDir);
            const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));
            // Process each PDF
            for (const pdfFile of pdfFiles) {
                const sourcePath = path_1.default.join(inputDir, pdfFile);
                const outputPath = path_1.default.join(outputDir, `cropped_${pdfFile}`);
                await PDFUtils.createCroppedPDF(sourcePath, outputPath);
            }
            console.log(`Processed ${pdfFiles.length} PDF files`);
        }
        catch (error) {
            console.error("Error processing directory:", error);
            throw error;
        }
    }
    static async processPDFs(inputDir, outputDir) {
        try {
            await this.processDirectory(inputDir, outputDir);
        }
        catch (error) {
            console.error("Failed to process PDFs:", error);
            throw error;
        }
    }
}
exports.PDFUtils = PDFUtils;
