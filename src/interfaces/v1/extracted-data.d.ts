interface ExtractedData {
  fileName: string;
  data: DataItem[];
}

interface DataItem {
  label: string;
  strings: string[];
}

// export interface Personnel {
//   drafter: string | null;
//   checker: string | null;
//   approval: string | null;
//   welding: string | null;
//   integration: string | null;
//   mechanical: string | null;
// }

// export interface ExtractedData {
//   drawingNumber: string | null;
//   title: string | null;
//   types: string[] | null;
//   size: string | null;
//   sheets: number | null;
//   revision: string;  // Not null because default is "0"
//   drawingDate: string | null;
//   personnel: Personnel;
//   revisionInfo: string | null;
// }

export { ExtractedData, DataItem };
