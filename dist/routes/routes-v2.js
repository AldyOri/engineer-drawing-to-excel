"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uploadController_1 = require("../controllers/v2/uploadController");
const processController_1 = require("../controllers/v2/processController");
const downloadController_1 = require("../controllers/v2/downloadController");
const constants_1 = require("../constants/constants");
const routerV2 = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, constants_1.UPLOADS_DIR_V2);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const originalName = path_1.default.parse(file.originalname).name;
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${originalName}${extension}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        }
        else {
            cb(null, false);
        }
    },
});
routerV2.post("/upload", upload.array("files"), uploadController_1.uploadFiles);
routerV2.post("/process", processController_1.processFiles);
routerV2.get("/download", downloadController_1.downloadExcel);
exports.default = routerV2;
