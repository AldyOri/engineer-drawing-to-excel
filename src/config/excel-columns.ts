import { ExcelColumn } from "../interfaces/excel-columns";

export const EXCEL_COLUMNS: ExcelColumn[] = [
  { header: "No", key: "no", width: 5 },
  { header: "Proyek", key: "project", width: 36 },
  { header: "No Gambar", key: "drawingNo", width: 28 },
  { header: "Nama Gambar", key: "drawingName", width: 64 },
  { header: "Type", key: "type", width: 11 },
  { header: "Size", key: "size", width: 7 },
  { header: "Sheet", key: "sheet", width: 7 },
  { header: "Rev", key: "rev", width: 6 },
  { header: "Tanggal Drawing", key: "drawingDate", width: 14 },
  { header: "Tanggal Release", key: "releaseDate", width: 13 },
  { header: "Drafter", key: "drafter", width: 12 },
  { header: "Checker", key: "checker", width: 12 },
  { header: "Approval", key: "approval", width: 12 },
  { header: "Welding", key: "welding", width: 12 },
  { header: "Integration", key: "integration", width: 12 },
  { header: "Mechanical System", key: "mechanicalSystem", width: 12 },
  { header: "Ket", key: "remarks", width: 26 }
];