"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const fs_1 = __importDefault(require("fs"));
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "no file found" });
            //   return;
        }
        const filePath = req.file.path;
        // bagian proses computer vision
        // bagian convert ke excel
        res.download(filePath, (err) => {
            if (err)
                throw err;
            // Clean up files after download
            fs_1.default.unlinkSync(filePath); // Delete uploaded file
        });
    }
    catch (error) {
        console.error("Error processing file:", error);
        res.status(500).send("Something went wrong.");
    }
};
exports.uploadFile = uploadFile;
