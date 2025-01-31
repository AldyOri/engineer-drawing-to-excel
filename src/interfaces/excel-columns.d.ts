import { Column } from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width: number;
  colspan?: number;
  rowspan?: number;
}

export interface ExcelRowData {
  no: number;
  project: string;
  drawingNo: string;
  drawingName: string;
  type: string;
  size: string;
  sheet: string;
  rev: string;
  drawingDate: string;
  releaseDate: string;
  drafter: string;
  checker: string;
  approval: string;
  welding: string;
  integration: string;
  mechanicalSystem: string;
  remarks: string;
}