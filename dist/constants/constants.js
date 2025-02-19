"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_PROMPT = exports.DOCUMENT_DELIMITER = exports.OUTPUTS_DIR_V2 = exports.UPLOADS_DIR_V2 = exports.OUTPUTS_DIR_V1 = exports.UPLOADS_DIR_V1 = exports.PORT = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const PROJECT_ROOT = path_1.default.join(__dirname, "../../");
exports.PORT = 3000;
exports.UPLOADS_DIR_V1 = path_1.default.join(PROJECT_ROOT, "uploads/v1");
exports.OUTPUTS_DIR_V1 = path_1.default.join(PROJECT_ROOT, "outputs/v1");
exports.UPLOADS_DIR_V2 = path_1.default.join(PROJECT_ROOT, "uploads/v2");
exports.OUTPUTS_DIR_V2 = path_1.default.join(PROJECT_ROOT, "outputs/v2");
exports.DOCUMENT_DELIMITER = "\n####<<<<====****DOCUMENT_BOUNDARY****====>>>>####\n".trim();
exports.AI_PROMPT = `
IMPORTANT: Process each document independently.
Documents are separated by the delimiter: "${exports.DOCUMENT_DELIMITER}"

CRITICAL RULES:
1. Use "${exports.DOCUMENT_DELIMITER}" to identify document boundaries (Define the document scope)
2. Process each document independently (Enforce core processing principle)
3. Never mix information between documents (Reinforce independent processing)
4. Return null for any field not found or invalid (Handle missing/invalid data gracefully)
5. Follow exact field names and data types (Schema compliance)
6. Complete all of the data from source (Extracted data)

For each document between delimiters:

SECTION A: Drawing Information
---------------------------
A1. Drawing Number
    - Look ONLY in "DRAWING NO" field
    - Examples: "49.3-A18006", "ASM_86.1-K56003", "TB1014-07.0-100", "AP1-TB1014-00.1-000"
    - Include any prefixes (ASM_, AP1-) if present
    - Maintain exact formatting including underscores, dots, and hyphens
    - Do not modify or remove any part of the number

A2. Title
    - Look ONLY in the "TITLE" field.
    - Extract the COMPLETE title, combining ALL lines of text related to the title into a single line.
    - To determine if a line of text is part of the title, consider:
        *   Proximity: Is the line of text located immediately below or near the "TITLE:" label?
        *   Visual Alignment: Does the line of text appear to be visually aligned with the "BOGIE ASSEMBLY" text, as part of the same overall title block?
    - Preserve ALL CAPS formatting if present.
    - Keep any numbers, hyphens, or special characters in the title.
    - **When combining lines, insert a single space between each line of text.**
    - Remove any leading/trailing spaces.
    - Example:
      Input:  "SCHEMATIC DIAGRAM OF
              ENDWALL CONTROL PANEL"
      Output: "SCHEMATIC DIAGRAM OF ENDWALL CONTROL PANEL"
    - Special instructions: If multiple titles are found, combine all of those titles in a single line, and if it's not found, return null.
    
A3. Type Code - CRITICAL INSTRUCTIONS
    LOCATION:
    - Focus your search within the title block in the vicinity of the column labeled "TYPE". Refer to the document for the specific visual layout of the title block to identify the precise location of the "TYPE" column.
    - The "TYPE" codes are typically located directly beneath the "TYPE" label, within their respective cells.
    - DO NOT extract codes from areas labeled "NO", "ORDER", "STANDARD", or any other labels besides "TYPE".
    - DO NOT extract codes from the drawing title if TYPE code has already been found in its respective column.

    VALIDATION:
    - Extract ALL types found in the "TYPE" column of the title block.
    - If an invalid code is extracted in the list, continue extraction.
    - Use this VALID TYPE CODES as examples to determine validity:  T, M, TC, MC, KU, KRL, TB , T1, T2, TC1, TC2, T1', TC', KU Jabo, EMU-R, VM-KU, 612
    - DO NOT extract codes from the title since the codes from TYPE column are more reliable
    - DO NOT include invalid codes like "KCI". Ensure that each extracted code matches one of the VALID PATTERNS.
    - Preserve exact case and formatting.
    - Remove any leading or trailing whitespace from each extracted code.
    - Return an empty array [] if no valid types are found in the "TYPE" column.
    - If the same valid type code appears multiple times, return only one instance of the code.

A4. Drawing Size
    - Format: ONLY A1, A2, A3, or A4
    - Look in title block or in the corner of a page
    - Must match exact format (uppercase A, single digit)
    - Return null if not matching format

A5. Total Sheets
    - Look for "SHEET" or "NO OF SHEET" field with format "X OF Y"
    - Return Y (total number) as integer
    - Example: "1 OF 6" → return 6
    - Must match total shown in field
    - Return null if unclear or not found

A6. Revision Code
    - Look ONLY in "REV" or "REVISION" field
    - Usually inside circle/box
    - VALID: Single uppercase letters A-Z and 0
    - INVALID: Numbers, multiple letters (except 0)
    - Special cases:
      * "0" or "O" -> return null
      * Empty/not found -> return null

A7. Drawing Date
    - Look ONLY in "APPROVED" or "APPROVED BY" field
    - Valid formats: DD/MM/YYYY or DD-MM-YYYY
    - Match exact date shown
    - Do not modify date format
    - Examples: "28/11/2024", "13-01-2025"
    - Return null if not found or invalid format

SECTION B: Personnel Information
----------------------------
B1. Drafter
    - Look ONLY in "DRAWN BY" field.
    - DO NOT extract from "INITIAL", "CHECKED BY", "REVISED BY", "APPROVED BY" field.
    - Usually 2-3 letter codes (e.g., SDH, JAP, ACK, etc.).
    - Return exact case as shown.

B2. Checker
    - Look ONLY in "CHECKED BY" field.
    - DO NOT extract from "INITIAL", "DRAWN BY", "REVISED BY", "APPROVED BY" field.
    - Usually 2-3 letter codes (e.g., TRP, AES, CHR, etc.).
    - Return exact case as shown.

B3. Approver
    - Look ONLY within the cell explicitly labeled "APPROVED BY :". Refer to the **document** for the exact visual layout of the title block.
    - Extract the text located immediately below "APPROVED BY :". The expected format is a code consisting of 2-4 uppercase letters or a combination of letters and numbers (e.g., MME, AB1, DYT).
    - If both a code and a date are present in the cell, extract ONLY the code. The date will typically be in the format DD-MM-YYYY.
    - Return the extracted code in its exact case.
    - If the "APPROVED BY :" cell is empty, illegible, or the expected code cannot be identified, return null.

B4. Integration
    - Look ONLY in "INITIAL" field.
    - DO NOT extract from "DRAWN BY", "CHECKED BY", "REVISED BY", "APPROVED BY" field.
    - Common location: Left side of main table.
    - Usually 2-3 letter codes (e.g., LGA, SSR, etc.).
    - Return null if not found.

B5-B6. Welding & Mechanical
    - Always return null (not used).

SECTION C: Additional Information
-----------------------------
C1. Revision Info Code
    - Look for the Revision Info Code in the vicinity of the "CONTENTS" field, but specifically for a string matching the format KA/(DE|EES)/XXX/YYYY.
    - Valid Format: KA/(DE|EES)/XXX/YYYY
    - Examples: "KA/DE/271/2024", "KA/DE/8/2025"
    - XXX: 1-3 digits
    - YYYY: 4 digits
    - Remove any leading/trailing characters before and after extracting the code.
    - If a string matching this format is found directly after the label "REV" remove the string and just extract the actual code.
    - Rules:
      * Must exist if Revision is A-Z (not 0)
      * Must be null if Revision Code is null
      * Return exact format with slashes

C2. isCanceled
    - Look for a clear and prominent visual indication that the drawing has been cancelled.
    - Keywords to look for: "CANCELLED", "CANCELED", "VOID", "SUPERSEDED".
    - If any of these keywords (or visually similar indicators) are found prominently displayed on the document (e.g., stamped across the drawing), set isCanceled to true.
    - If there is no clear indication of cancelation, or the document explicitly states that it is still active, set isCanceled to false.
    - If it is found in the watermarks of the document, set to true.
    - Default value: false.
`.trim();
// To Do:
// incrase accuracy for 5 docs each batch, especially in "type", "rev", "drafter"
// Notes location :
// drawing date : approved by
// drafter : drawn by
// checker : checked by (bawah)
// approval : aproved by (bawah)
// welding : kosong
// integration : initial (bisa kosong)
// mechanical system : kosong
// Notes tambahan jika canceled:
// jika cancel NAMA_GAMBAR_CANCELED
// ket. ganti nomer cancelation
[exports.UPLOADS_DIR_V1, exports.OUTPUTS_DIR_V1, exports.UPLOADS_DIR_V2, exports.OUTPUTS_DIR_V2].forEach((dir) => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});
