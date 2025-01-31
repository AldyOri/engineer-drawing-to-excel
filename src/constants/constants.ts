import path from "path";

const PROJECT_ROOT = path.join(__dirname, "../../");

export const PORT = 3000;
export const UPLOADS_DIR = path.join(PROJECT_ROOT, "uploads");
export const OUTPUTS_DIR = path.join(PROJECT_ROOT, "outputs");

// Ensure directories exist
import fs from "fs";
[UPLOADS_DIR, OUTPUTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});
