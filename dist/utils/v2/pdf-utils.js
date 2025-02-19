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
    static async checkPDFLayers(doc) {
        try {
            const catalog = doc.context.lookup(doc.context.trailerInfo.Root);
            if (!(catalog instanceof pdf_lib_1.PDFDict))
                return { hasLayers: false };
            const ocProperties = catalog.lookup(pdf_lib_1.PDFName.of("OCProperties"));
            if (!(ocProperties instanceof pdf_lib_1.PDFDict))
                return { hasLayers: false };
            const ocgs = ocProperties.lookup(pdf_lib_1.PDFName.of("OCGs"));
            if (!(ocgs instanceof pdf_lib_1.PDFArray))
                return { hasLayers: false };
            const layers = [];
            for (const ocg of ocgs.asArray()) {
                if (ocg instanceof pdf_lib_1.PDFRef) {
                    const layer = doc.context.lookup(ocg);
                    if (layer instanceof pdf_lib_1.PDFDict) {
                        const name = layer.lookup(pdf_lib_1.PDFName.of("Name"));
                        if (name instanceof pdf_lib_1.PDFString) {
                            layers.push({
                                name: name.asString(),
                                ref: ocg,
                            });
                        }
                    }
                }
            }
            return {
                hasLayers: layers.length > 0,
                layers: layers,
            };
        }
        catch (error) {
            console.error("Error checking PDF layers:", error);
            return { hasLayers: false };
        }
    }
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
            let { width, height } = sourcePage.getSize();
            // Check if the PDF has layers
            const layerInfo = await this.checkPDFLayers(sourceDoc);
            console.log("PDF layer information:", layerInfo);
            // Extract annotations before creating new page
            const annotations = await this.extractAnnotations(sourcePage);
            // Create new page with full or half height based on layers
            const newPage = newDoc.addPage([
                width,
                layerInfo.hasLayers ? height : height / 2,
            ]);
            if (layerInfo.hasLayers && layerInfo.layers) {
                // Handle layered PDF
                const desiredLayers = layerInfo.layers.filter((layer) => this.DESIRED_LAYERS.includes(layer.name));
                if (desiredLayers.length > 0) {
                    console.log("Processing PDF with layers:", desiredLayers.map((l) => l.name));
                    // Embed page with only desired layers visible
                    const embeddedPage = await newDoc.embedPage(sourcePage, {
                        left: 0,
                        bottom: 0,
                        right: width,
                        top: height,
                        ocgs: desiredLayers.map((layer) => layer.ref),
                    });
                    // Draw the embedded content
                    newPage.drawPage(embeddedPage, {
                        x: 0,
                        y: 0,
                        width: width,
                        height: height,
                    });
                }
            }
            else {
                // Handle non-layered PDF (crop to bottom half)
                console.log("Processing PDF without layers - cropping to bottom half");
                const embeddedPage = await newDoc.embedPage(sourcePage, {
                    top: height / 2,
                    bottom: 0,
                    left: 0,
                    right: width,
                });
                newPage.drawPage(embeddedPage, {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height / 2,
                });
            }
            // Add annotations
            const font = await newDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
            const fontSize = 7;
            const xOffset = 5;
            const yOffset = 5;
            for (const annot of annotations) {
                // Filter annotations based on page type
                const shouldIncludeAnnotation = layerInfo.hasLayers
                    ? true // Include all annotations for layered PDFs
                    : annot.y <= height / 2; // Only bottom half for non-layered PDFs
                if (shouldIncludeAnnotation) {
                    // Draw white background rectangle
                    newPage.drawRectangle({
                        x: annot.x + xOffset - 2,
                        y: annot.y + yOffset - 2,
                        width: Math.min(newPage.getWidth() - annot.x, font.widthOfTextAtSize(annot.text, fontSize) + 4),
                        height: fontSize + 4,
                        color: (0, pdf_lib_1.rgb)(1, 1, 1),
                        opacity: 1,
                    });
                    // Draw text
                    newPage.drawText(annot.text, {
                        x: annot.x + xOffset,
                        y: annot.y + yOffset,
                        size: fontSize,
                        font: font,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0),
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
            console.log(`Created PDF at: ${outputPath} with ${annotations.length} annotations (${layerInfo.hasLayers ? "layered" : "cropped"} mode)`);
        }
        catch (error) {
            console.error("Error creating PDF:", error);
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
PDFUtils.DESIRED_LAYERS = [
    "0",
    "AM_0",
    "Border (ISO)",
    "Title (ISO)",
    "Hatch (ISO)",
];
