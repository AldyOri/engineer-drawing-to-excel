import { Request, Response } from "express";
import fs from "fs";

export const uploadFile = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "no file found" });
      //   return;
    }

    const filePath = req.file.path;



    res.download(filePath, (err) => {
      if (err) throw err;

      // Clean up files after download
      fs.unlinkSync(filePath); // Delete uploaded file
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Something went wrong.");
  }
};
