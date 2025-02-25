import path from "path";
import fs from "fs";

export const PORT = 3000;

export const PROJECT_ROOT = path.join(__dirname, "../../");

export const UPLOADS_DIR_V1 = path.join(PROJECT_ROOT, "uploads/v1");
export const OUTPUTS_DIR_V1 = path.join(PROJECT_ROOT, "outputs/v1");

export const UPLOADS_DIR_V2 = path.join(PROJECT_ROOT, "uploads/v2");
export const OUTPUTS_DIR_V2 = path.join(PROJECT_ROOT, "outputs/v2");

export const DOCUMENT_DELIMITER =
  "\n####<<<<====****DOCUMENT_BOUNDARY****====>>>>####\n".trim();

export const AI_PROMPT = `
IMPORTANT: Process each document independently.
Documents are separated by the delimiter: "${DOCUMENT_DELIMITER}"

CRITICAL RULES:
1. Use "${DOCUMENT_DELIMITER}" to identify document boundaries (Define the document scope)
2. Process each document independently (Enforce core processing principle)
3. Never mix information between documents (Reinforce independent processing)
4. Return null for any field not found or invalid (Handle missing/invalid data gracefully)
5. Follow exact field names and data types (Schema compliance)
6. Complete all of the data from source (Extracted data)

For each document between delimiters:

SECTION A: Drawing Information
---------------------------
A1. Drawing Number - (drawingNumber)
    - Look ONLY in "DRAWING NO" field
    - Examples: "49.3-A18006", "ASM_86.1-K56003", "TB1014-07.0-100", "AP1-TB1014-00.1-000", "34.2-I27001"
    - Include any prefixes (ASM_, AP1-) if present
    - Maintain exact formatting including underscores, dots, and hyphens
    - Do not modify or remove any part of the number

A2. Title - (title)
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
    
A3. Type Codes - (types)
    LOCATION:
    - Look ONLY within the column labeled "TYPE" Codes are directly above the "TYPE" label, in their cells.

    VALIDATION:
    - Extract ALL valid codes found in the "TYPE" column.
    - Valid codes ARE: T, M, TC, MC, KU, KRL, TB, T1, T2, TC1, TC2, T1', TC', KU Jabo, EMU-R, VM-KU, 612.
    - Invalid codes ARE: KCI, STANDARD
    - If NO valid codes are found in the "TYPE" column, return an empty array ([]).
    - If same valid code appears multiple times, return only one.

    REJECT:
    - DO NOT extract anything from the drawing title.
    - Remove any leading or trailing whitespace in the code name
    - Preserve exact case and formatting within each extracted code.

A4. Drawing Size - (size)
    - Format: ONLY A1, A2, A3, or A4
    - Look in title block or in the corner of a page
    - Must match exact format (uppercase A, single digit)
    - Return null if not matching format

A5. Total Sheets - (sheets)
    - Look only for "SHEET" field with format "X OF Y"
    - Return Y (total number) as integer
    - Example: "1 OF 6" → return 6
    - Must match total shown in field
    - Return null if unclear or not found

A6. Revision Code - (revision)
    - Look ONLY in "REV" or "REVISION" field
    - Usually inside circle/box
    - VALID: Single uppercase letters A-Z
    - INVALID: Numbers, multiple letters
    - Special cases:
      * "0" or "O" -> return null
      * Empty/not found -> return null 

A7. Drawing Date - (drawing date)
    - Look ONLY in "APPROVED" or "APPROVED BY" field
    - Valid formats: DD/MM/YYYY or DD-MM-YYYY
    - Match exact date shown
    - Do not modify date format
    - Examples: "28/11/2024", "13-01-2025"
    - Return null if not found or invalid format
    - If MULTIPLE valid dates are found:
        * Compare the dates to determine the MOST RECENT date.
        * Return the MOST RECENT date in the original format it was found.

SECTION B: Personnel Information
----------------------------
B1. Drafter - (drafter)
    - Look ONLY in "DRAWN BY" field.
    - DO NOT extract from "INITIAL", "CHECKED BY", "REVISED BY", "APPROVED BY" field.
    - Usually 2-3 letter codes (e.g., SDH, JAP, ACK, etc.).
    - Return exact case as shown.

B2. Checker - (checker)
    - Look ONLY in "CHECKED BY" field.
    - DO NOT extract from "TYPE" column
    - DO NOT extract from "INITIAL", "DRAWN BY", "REVISED BY", "APPROVED BY", field.
    - Usually 2-3 letter codes (e.g., TRP, AES, CHR, etc.).
    - Return exact case as shown.

B3. Approver - (approval)
    - Look ONLY within the cell explicitly labeled "APPROVED BY :". Refer to the **document** for the exact visual layout of the title block.
    - Extract the text located immediately below "APPROVED BY :". The expected format is a code consisting of 2-4 uppercase letters or a combination of letters and numbers (e.g., MME, AB1, DYT).
    - If both a code and a date are present in the cell, extract ONLY the code. The date will typically be in the format DD-MM-YYYY.
    - Return the extracted code in its exact case.
    - If the "APPROVED BY :" cell is empty, illegible, or the expected code cannot be identified, return null.

B4. Integration - (integration)
    - Look EXCLUSIVELY in the "INITIAL" field.
    - Refine your search by Focusing on the Outside of the main table.
    - If no value is found in "INITIAL" then it MUST return null.
    - If "INITIAL" field not found return null

    VALIDATION:
    - In This extract make sure that you only extract if the data matches to “Usually 2-3 letter codes" such as LGA, SSR, etc.
    - Do NOT extract ANY TEXT such as "DRAWN BY", "CHECKED BY", "REVISED BY", "APPROVED BY", "NO", "ORDER", "TYPE", "STANDARD", "KCI" or ANY OTHER DATA unrelated to the integration code.
    - In case of error then return null as before, we prioritize following the extraction rules and instructions.

    REJECT:
    - DO NOT extract invalid codes (e.g., KCI, STANDARD).

B5-B6. Welding & Mechanical
    - Always return null (not used).

SECTION C: Additional Information
-----------------------------
C1. Revision Info Code - (revisionInfo)
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

C2. isCanceled - (isCanceled)
    - Look for a clear and prominent visual indication that the drawing has been cancelled.
    - Keywords to look for: "CANCELLED", "CANCELED", "VOID".
    - If any of these keywords (or visually similar indicators) are found prominently displayed on the document (e.g., stamped across the drawing), set isCanceled to true.
    - If there is no clear indication of cancelation, or the document explicitly states that it is still active, set isCanceled to false.
    - If it is found in the watermarks of the document, set to true.
    - Default value: false.

C3. Cancelation Code - (cancelationCode)
    - This is a CONDITIONAL field. It should ONLY be extracted if isCanceled is "true". If isCanceled is "false", return null.
    - If isCanceled is "true", look for a code or reference near the "CANCELLED" stamp or the keywords used to identify the cancellation, that tells more info for the reason.
    - Valid examples for code include:
        *”DCR KA/BWD/73/2024”
    - Extract ONLY this part: KA/BWD/73/2024. 
    - Preserve exact case and formatting from the source for the "CODE" field if it is available. If not the the text around the "CANCELLED" or "CANCELED".
    - If no specific code is found return an empty string ("").
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

// export const AI_PROMPT_V2 = `
// IMPORTANT: Process each document independently.
// Documents are separated by the delimiter: "${DOCUMENT_DELIMITER}"

// CRITICAL RULES:
// 1.  Use "${DOCUMENT_DELIMITER}" to identify document boundaries (Define document scope)
// 2.  Process each document independently (Enforce core processing principle)
// 3.  Never mix information between documents (Reinforce independent processing)
// 4.  Return null for any field not found or invalid (Handle missing/invalid data gracefully)
// 5.  Follow exact field names and data types (Schema compliance)
// 6.  Complete all of the data from source (Extracted data)

// For each document between delimiters:

// drawingNumber:  Look ONLY in "DRAWING NO" field and:
//     - Examples: "49.3-A18006", "ASM_86.1-K56003", "TB1014-07.0-100", "AP1-TB1014-00.1-000", "34.2-I27001".
//     - Include any prefixes (ASM_, AP1-) if present.
//     - Maintain exact formatting including underscores, dots, and hyphens.
//     - Do not modify or remove any part of the number.

// title: Look ONLY in the "TITLE" field and:
//     - Extract the COMPLETE title, combining ALL lines of text related to the title into a single line.
//     - To determine if a line of text is part of the title, consider proximity and visual alignment with the "TITLE:" label.
//     - Preserve ALL CAPS formatting.
//     - Keep numbers, hyphens, special characters.
//     - Insert a single space between combined lines.
//     - Remove leading/trailing spaces.
//     - If multiple titles, combine into one line; if not found, return null.

// types: Look ONLY within the "TYPE" column of the title block and:
//     - Extract ALL valid codes found directly below the "TYPE" label.
//     - Valid codes ARE: T, M, TC, MC, KU, KRL, TB, T1, T2, TC1, TC2, T1', TC', KU Jabo, EMU-R, VM-KU, 612.
//     - If NO valid codes are found, return an empty array ([]).
//     - If the same valid code appears multiple times, return only one instance.
//     - Remove leading/trailing whitespace.
//     - Preserve exact case and formatting.
//     - EXCLUDE invalid codes (e.g., KCI, STANDARD).

// size: Look ONLY in the title block OR in the corner of a page, format is ONLY A1, A2, A3, or A4 and:
//     - Return null if not matching format (uppercase A, single digit).

// sheets: Look only for "SHEET" OR "NO OF SHEET" field with format "X OF Y" and:
//     - Return Y (total number) as integer.
//     - Example: "1 OF 6" → return 6.
//     - Must match total shown in field.
//     - Return null if unclear or not found.

// revision: Look ONLY in "REV" or "REVISION" field, usually inside circle/box and:
//     - VALID: Single uppercase letters A-Z.
//     - INVALID: Numbers, multiple letters.
//     - Special cases:
//       * "0" or "O" -> return null.
//       * Empty/not found -> return null.

// drawingDate: Look ONLY in "APPROVED" or "APPROVED BY" field and:
//     - Valid formats: DD/MM/YYYY or DD-MM-YYYY.
//     - Match exact date shown.
//     - Do not modify date format.
//     - Examples: "28/11/2024", "13-01-2025".
//     - If MULTIPLE valid dates are found:
//         * Compare dates to determine the MOST RECENT.
//         * Return the MOST RECENT date in its original format.
//     - Return null if not found or invalid format.

// drafter: Look ONLY in "DRAWN BY" field and:
//     - Return exact case as shown.
//     - Usually 2-3 letter codes (e.g., SDH, JAP, ACK).
//     - If "DRAWN BY" field not found return null

// checker: Look ONLY in "CHECKED BY" field and:
//     - DO NOT extract from TYPE column
//     - Return exact case as shown.
//     - Usually 2-3 letter codes (e.g., TRP, AES, CHR).
//     - Return null if “CHECKED BY” field not found.

// approval: Look ONLY within the cell explicitly labeled "APPROVED BY :" and:
//     - Extract the text immediately below "APPROVED BY :". Expected format: 2-4 uppercase letters or letter/number combo (e.g., MME, AB1, DYT).
//     - If both a code and a date are present, extract ONLY the code (date format: DD-MM-YYYY).
//     - Return the extracted code in its exact case.
//     - If "APPROVED BY :" is empty, illegible, or the expected code can't be identified, return null.

// integration: Look EXCLUSIVELY in the "INITIAL" field and:
//     - Refine your search by Focusing on the Outside of the main table.
//     - If no value is found in "INITIAL" then it MUST return null.
//     - If "INITIAL" field not found return null
//     -VALIDATE using this “Usually 2-3 letter codes" to return the data.
//     -REJECT data from invalid codes (e.g., KCI, STANDARD).

// welding: Always return null.

// mechanical: Always return null.

// revisionInfo: Look for the Revision Info Code in the vicinity of the "CONTENTS" field and:
//     - Specifically look for a string matching the format KA/(DE|EES)/XXX/YYYY.
//     - Valid Format: KA/(DE|EES)/XXX/YYYY
//     - Examples: "KA/DE/271/2024", "KA/DE/8/2025"
//     - Remove any leading/trailing characters before and after extracting the code.
//     - If a string matching this format is found directly after the label "REV" remove the string and extract from the actual code.
//     - Rules:
//       * Must exist if Revision is A-Z (not 0)
//       * Must be null if Revision Code is null
//       * Return exact format with slashes

// isCanceled: Look for a clear and prominent visual indication that the drawing has been cancelled and:
//     - Keywords: "CANCELLED", "CANCELED", "VOID".
//     - If found prominently displayed (e.g., stamped), set to true.
//     - If explicitly stated that the document is still active, set to false.
//     - If found in watermarks, set to true.
//     - Default value: false.

// cancelationCode: This is a CONDITIONAL field. If isCanceled is "true" and:
//     - If isCanceled is "true", look for a code or reference near the "CANCELLED" stamp or keywords.
//     - Valid examples:
//         *”DCR KA/BWD/73/2020”
//     - Extract ONLY this part: KA/BWD/73/2020.
//     - Preserve source case and formatting.
//     - If no specific code is found, return an empty string ("").
//     -If isCanceled is “false”, return null
// `.trim();

[UPLOADS_DIR_V1, OUTPUTS_DIR_V1, UPLOADS_DIR_V2, OUTPUTS_DIR_V2].forEach(
  (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
);
