import { Router } from "express";
import multer from "multer";
import path from "path";
import { uploadFiles } from "../controllers/v2/uploadController";
import { processFiles } from "../controllers/v2/processController";
import { downloadExcel } from "../controllers/v2/downloadController";
import { UPLOADS_DIR_V2 } from "../constants/constants";

const routerV2 = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR_V2);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}${extension}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

routerV2.post("/upload", upload.array("files"), uploadFiles);
routerV2.post("/process", processFiles);
routerV2.get("/download", downloadExcel);

export default routerV2;
