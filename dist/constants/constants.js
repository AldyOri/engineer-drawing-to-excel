"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUTS_DIR = exports.UPLOADS_DIR = exports.PORT = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const PROJECT_ROOT = path_1.default.join(__dirname, "../../");
exports.PORT = 3000;
exports.UPLOADS_DIR = path_1.default.join(PROJECT_ROOT, "uploads");
exports.OUTPUTS_DIR = path_1.default.join(PROJECT_ROOT, "outputs");
[exports.UPLOADS_DIR, exports.OUTPUTS_DIR].forEach((dir) => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});
