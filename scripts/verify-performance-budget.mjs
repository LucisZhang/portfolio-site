import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const manifestPath = path.join(root, ".next/server/app/page_client-reference-manifest.js");
const context = { globalThis: {} };
vm.runInNewContext(await readFile(manifestPath, "utf8"), context, { filename: manifestPath });

const manifest = context.globalThis.__RSC_MANIFEST?.["/page"];
if (!manifest) throw new Error("Homepage client-reference manifest is missing. Run npm run build first.");

const javascript = [...new Set(Object.values(manifest.entryJSFiles).flat())];
const styles = [...new Set(Object.values(manifest.entryCSSFiles).flatMap((files) => files.map((file) => file.path)))];

async function totalBytes(files) {
  const sizes = await Promise.all(files.map(async (file) => (await stat(path.join(root, ".next", file))).size));
  return sizes.reduce((total, size) => total + size, 0);
}

const jsBytes = await totalBytes(javascript);
const cssBytes = await totalBytes(styles);
const budgets = { javascript: 200_000, css: 145_000 };

if (jsBytes > budgets.javascript) throw new Error(`Homepage JavaScript ${jsBytes} exceeds ${budgets.javascript} bytes.`);
if (cssBytes > budgets.css) throw new Error(`Homepage CSS ${cssBytes} exceeds ${budgets.css} bytes.`);

console.log(`Homepage build budget passed: ${jsBytes} JS bytes, ${cssBytes} CSS bytes (uncompressed).`);
