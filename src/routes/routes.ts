import { Router } from "express";
import multer from "multer";
import { uploadFiles } from "../controllers/uploadController";
import { processFiles } from "../controllers/processController";
import { downloadExcel } from "../controllers/downloadController";
import path from "path";
import { UPLOADS_DIR } from "../constants/constants";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
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

router.post("/upload", upload.array("files"), uploadFiles);
router.post("/process", processFiles);
router.get("/download", downloadExcel);

export default router;
