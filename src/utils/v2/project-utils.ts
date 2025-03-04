import axios from "axios";
import { ExtractedData } from "../../interfaces/v2/extracted-data";
import { OUTPUTS_DIR_V2 } from "../../constants/constants";
import path from "node:path";
import fs from "node:fs"

interface ProjectType {
  id: number;
  title: string;
  project_code: string;
  created_at: string;
  updated_at: string;
}

export class ProjectUtils {
  private static readonly API_URL = process.env.API_URL_INKA as string;
  private static readonly API_KEY = process.env.API_KEY_INKA as string;

  static async fetchProjectTypes(): Promise<ProjectType[]> {
    try {
      const response = await axios.get(this.API_URL, {
        headers: {
          "X-API-KEY": this.API_KEY,
        },
      });
      console.log(`Successfully fetched ${response.data.length} project types`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch project types:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return [];
    }
  }

  static extractProjectCode(drawingNumber: string): string | null {
    // Match characters after dash until a digit
    const match = drawingNumber.match(/-([A-Z]+\d+)/i);
    if (match && match[1]) {
      return match[1].substring(0, 3);
    }
    return null;
  }

  static async enrichWithProjectNames(
    data: ExtractedData[]
  ): Promise<ExtractedData[]> {
    const projectTypes = await this.fetchProjectTypes();

    if (projectTypes.length === 0) {
      console.warn("No project types available for enrichment");
      return data;
    }

    const enriched = data.map((item) => {
      if (item.drawingNumber) {
        console.log(`Processing drawing number: ${item.drawingNumber}`);
        const extractedCode = this.extractProjectCode(item.drawingNumber);
        // console.log(`Extracted code: ${extractedCode}`);

        if (extractedCode) {
          const matchingProject = projectTypes.find((project) =>
            extractedCode.startsWith(project.project_code)
          );

          if (matchingProject) {
            // console.log(`Found matching project: ${matchingProject.title}`);
            return {
              ...item,
              projectName: matchingProject.title,
            };
          } else {
            console.log(`No matching project found for code: ${extractedCode}`);
          }
        }
      }
      return item;
    });

    console.log(
      `Enriched ${
        enriched.filter((item) => item.projectName).length
      } items with project names`
    );

    // Save updated data
    await fs.promises.writeFile(
      path.join(OUTPUTS_DIR_V2, "extractedData.json"),
      JSON.stringify(enriched, null, 2)
    );
    return enriched;
  }
}
