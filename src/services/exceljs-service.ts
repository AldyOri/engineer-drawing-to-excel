import { Workbook } from "exceljs";
import { Buffer } from "node:buffer";
import { ExtractedData } from "../interfaces/extracted-data";
import { ExcelRowData } from "../interfaces/excel-columns";
import { EXCEL_COLUMNS } from "../config/excel-columns";

const AUTHOR = "Aldy Nugroho";

export async function generateExcel(data: ExtractedData[]): Promise<Buffer> {
  const workbook = new Workbook();

  // Set workbook properties
  workbook.creator = AUTHOR;
  workbook.lastModifiedBy = AUTHOR;
  workbook.created = new Date();
  workbook.properties.date1904 = true;

  // Create worksheet
  const worksheet = workbook.addWorksheet(
    new Date().toLocaleDateString("id-ID", {
      month: "long",
    })
  );
  worksheet.views = [
    {
      zoomScale: 70,
    },
  ];

  // Define columns for row 3
  worksheet.columns = EXCEL_COLUMNS;

  // Set default row height
  worksheet.properties.defaultRowHeight = 31.1;

  // Add and style the main header row
  worksheet.mergeCells("A1:Q1");
  const headerCell = worksheet.getCell("A1");
  headerCell.value = "Ini Header Text";
  headerCell.font = { bold: true, italic: true, size: 22 };
  headerCell.alignment = { horizontal: "center", vertical: "middle" };
  headerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };

  // Set header row height
  worksheet.getRow(1).height = 33;

  // Add an empty row before the header row
  worksheet.addRow([]);

  // Set row heights
  worksheet.getRow(3).height = 15.6;
  worksheet.getRow(4).height = 43.2;

  // Merge cells and set headers
  worksheet.mergeCells("A3:A4");
  worksheet.getCell("A3").value = "No";

  worksheet.mergeCells("B3:B4");
  worksheet.getCell("B3").value = "Proyek";

  worksheet.mergeCells("C3:C4");
  worksheet.getCell("C3").value = "No Gambar";

  worksheet.mergeCells("D3:D4");
  worksheet.getCell("D3").value = "Nama Gambar";

  worksheet.mergeCells("E3:E4");
  worksheet.getCell("E3").value = "Type";

  worksheet.mergeCells("F3:H3");
  worksheet.getCell("F3").value = "Paper";

  worksheet.getCell("F4").value = "Size";
  worksheet.getCell("G4").value = "Sheet";
  worksheet.getCell("H4").value = "Rev";

  worksheet.mergeCells("I3:I4");
  worksheet.getCell("I3").value = "Tanggal Drawing";

  worksheet.mergeCells("J3:J4");
  worksheet.getCell("J3").value = "Tanggal Release";

  worksheet.mergeCells("K3:P3");
  worksheet.getCell("K3").value = "Drawing Initial";

  worksheet.getCell("K4").value = "Drafter";
  worksheet.getCell("L4").value = "Checker";
  worksheet.getCell("M4").value = "Approval";
  worksheet.getCell("N4").value = "Welding";
  worksheet.getCell("O4").value = "Integration";
  worksheet.getCell("P4").value = "Mechanical System";

  worksheet.mergeCells("Q3:Q4");
  worksheet.getCell("Q3").value = "Ket";

  // Style header rows
  [3, 4].forEach((rowNumber) => {
    const row = worksheet.getRow(rowNumber);
    row.font = { bold: true, size: 12 };
    row.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF8497B0" }, // Background color #8497b0
      };
      cell.border = {
        top: { style: rowNumber === 3 ? "medium" : "thin" },
        left: { style: colNumber === 1 ? "medium" : "thin" },
        bottom: { style: rowNumber === 4 ? "medium" : "thin" },
        right: {
          style: colNumber === EXCEL_COLUMNS.length ? "medium" : "thin",
        },
      };
    });
  });

  // Ensure specific cells have medium top border
  ["A3", "B3", "C3", "D3", "E3", "I3", "J3", "Q3"].forEach((cellAddress) => {
    const cell = worksheet.getCell(cellAddress);
    cell.border = {
      top: { style: "medium" },
      left: cell.border?.left || { style: "thin" },
      bottom: cell.border?.bottom || { style: "thin" },
      right: cell.border?.right || { style: "thin" },
    };
  });

  // Process data into a single row
  const rows: ExcelRowData[] = data.map((file, fileIndex) => {
    const drawingDate =
      file.data.find((d) => d.label === "Tanggal Drawing")?.strings[0] || "";

    const formattedDrawingDate = drawingDate
      ? new Date(drawingDate.split(/[-\/]/).reverse().join("-"))
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          })
          .replace(/ /g, "-")
      : "";

    const row: ExcelRowData = {
      no: fileIndex + 1,
      project:
        file.data.find((d) => d.label === "Proyek")?.strings.join(" ") || "",
      drawingNo:
        file.data.find((d) => d.label === "No Gambar")?.strings.join(" ") || "",
      drawingName:
        file.data.find((d) => d.label === "Nama Gambar")?.strings.join(" ") ||
        "",
      type: file.data.find((d) => d.label === "Type")?.strings.join("; ") || "",
      size: file.data.find((d) => d.label === "Size")?.strings.join(" ") || "",
      sheet:
        file.data.find((d) => d.label === "Sheet")?.strings.join(" ") || "",
      rev: file.data.find((d) => d.label === "Rev")?.strings.join(" ") || "",
      drawingDate: formattedDrawingDate,
      releaseDate:
        file.data
          .find((d) => d.label === "Tanggal Release")
          ?.strings.join(" ") || "",
      drafter: file.data.find((d) => d.label === "Drafter")?.strings[0] || "",
      checker: file.data.find((d) => d.label === "Checker")?.strings[0] || "",
      approval: file.data.find((d) => d.label === "Approval")?.strings[0] || "",
      welding: file.data.find((d) => d.label === "Welding")?.strings[0] || "",
      integration:
        file.data.find((d) => d.label === "Integration")?.strings[0] || "",
      mechanicalSystem:
        file.data.find((d) => d.label === "Mechanical System")?.strings[0] ||
        "",
      remarks:
        file.data.find((d) => d.label === "Ket")?.strings.join(" ") || "",
    };
    return row;
  });

  // Add rows to worksheet starting from row 5
  const addedRows = worksheet.addRows(rows);

  // Apply alignment and font size to each cell in the data rows
  addedRows.forEach((row) => {
    row.height = 31.1;
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.font = { size: 12 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
