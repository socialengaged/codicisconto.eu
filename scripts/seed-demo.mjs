import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, "..", "data", "store.json");
const target = path.join(__dirname, "..", "data", "store.seeded.json");

await copyFile(source, target);

console.log(`Creato file demo: ${target}`);
