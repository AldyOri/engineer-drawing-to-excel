import { ExtractedData } from "../../interfaces/v2/extracted-data";

export class JSONUtils {
  static removeDuplicates(data: ExtractedData[]): ExtractedData[] {
    const uniqueDrawings = data.reduce((acc, current) => {
      // Skip invalid entries
      if (!current.drawingNumber && !current.title) {
        return acc;
      }

      // Check for existing drawing with same number or name
      const existingByNumber = acc.get(current.drawingNumber!);
      const existingByName = Array.from(acc.values()).find(
        (item) => item.title === current.title
      );
      const existing = existingByNumber || existingByName;

      // If drawing doesn't exist yet or current one is canceled, use current
      if (!existing || current.isCanceled) {
        acc.set(current.drawingNumber!, current);
      }
      // If existing one is not canceled and current is not canceled, keep existing
      return acc;
    }, new Map<string, ExtractedData>());

    return Array.from(uniqueDrawings.values());
  }
}
