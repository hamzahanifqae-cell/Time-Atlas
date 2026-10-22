import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../../..");
export const RAW_DIR = path.join(ROOT, "data/raw");
export const WORK_DIR = path.join(ROOT, "data/.work");
// Generated geo data is served as plain static files (fetched at runtime) rather than
// bundled into JS, so the browser can lazy-load it independently of the app bundle and
// cache it like any other static asset.
export const GENERATED_DIR = path.join(ROOT, "public/data");
export const TEXTURES_DIR = path.join(ROOT, "public/textures");
