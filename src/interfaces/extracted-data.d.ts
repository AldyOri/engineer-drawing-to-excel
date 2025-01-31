interface ExtractedData {
  fileName: string;
  data: DataItem[];
}

interface DataItem {
  label: string;
  strings: string[];
}

export { ExtractedData, DataItem };
