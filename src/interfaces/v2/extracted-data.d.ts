export interface Personnel {
  drafter: string | null;
  checker: string | null;
  approval: string | null;
  welding: string | null;
  integration: string | null;
  mechanical: string | null;
}

export interface ExtractedData {
  drawingNumber: string | null;
  title: string | null;
  types: string[] | null;
  size: string | null;
  sheets: number | null;
  revision: string | null;
  drawingDate: string | null;
  personnel: Personnel;
  revisionInfo: string | null;
  isCanceled: boolean;
  cancelationCode: string | null;
}

export { ExtractedData };
