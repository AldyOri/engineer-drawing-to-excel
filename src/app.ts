import express, { Application } from "express";
import uploadRoutes from "./routes/upload";
import { PDFExtract, PDFExtractOptions } from "pdf.js-extract";
import targetCoordinates from "./target-coordinates";
import fs from "fs";
import { generateExcel } from "./services/exceljs-service";

const app: Application = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/upload", uploadRoutes);

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

const pdfExtract = new PDFExtract();
const options: PDFExtractOptions = {
  firstPage: 1,
  lastPage: 1,
  normalizeWhitespace: true,
};

pdfExtract
  .extract("uploads/test.pdf", options)
  .then(async (data) => {
    // console.log(data);

    // Save the output as a formatted JSON file
    fs.writeFileSync("outputs/output.json", JSON.stringify(data, null, 2));

    // Extract strings from the parsed PDF data based on coordinates range
    const extractedStrings = targetCoordinates.map((coord) => {
      const strings = data.pages.flatMap((page) =>
        page.content
          .filter(
            (item) =>
              item.x >= coord.xStart &&
              item.x <= coord.xEnd &&
              item.y >= coord.yStart &&
              item.y <= coord.yEnd
          )
          .map((item) => item.str)
          .filter((str) => str.trim() !== "" && !str.includes("TITLE :"))
      );
      return {
        label: coord.label,
        strings: coord.label === "Nama Gambar" ? [strings.join(" ")] : strings,
      };
    });

    // Log the extracted strings
    console.log("Extracted Strings:", extractedStrings);

    // Format the extracted strings with file name
    const formattedData = [
      {
        fileName: "test.pdf",
        data: extractedStrings,
      },
    ];

    // Save the extracted strings as a JSON file
    fs.writeFileSync(
      "outputs/extractedStrings.json",
      JSON.stringify(formattedData, null, 2)
    );

    if (!fs.existsSync("outputs")) {
      fs.mkdirSync("outputs");
    }

    const excelBuffer = await generateExcel(formattedData);
    fs.writeFileSync("outputs/result.xlsx", excelBuffer);
    console.log("Excel file generated successfully at outputs/result.xlsx");
  })
  .catch((err) => {
    console.error("Error processing file:", err);
    throw err;
  });
