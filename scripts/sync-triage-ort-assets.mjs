import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Vendors the exact onnxruntime-web browser files Triage Router's
// LocalInference.tsx needs (task 3.1, spec section 6.3's "RUN THE MODEL IN
// THIS TAB" second step) into public/models/triage-tier-b2/ort/, mirroring
// the existing scripts/sync-duckdb-browser-assets.mjs precedent. Only the
// UMD wasm-backend script, its dynamically-imported glue module, and the
// single-threaded-capable WASM binary are copied -- the same three files
// nlp-eval-lab/demo/assets/live.js's loadOrtRuntime()
// loads, confirmed by grepping ort.wasm.min.js's own bundled references.
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// "./wasm" is the one subpath onnxruntime-web's package.json exports map
// resolves to a real dist/ file (there is no "./package.json" export), so
// it is the anchor used to locate the sibling dist/ directory.
const ortDist = dirname(require.resolve("onnxruntime-web/wasm"));
const destination = join(root, "public", "models", "triage-tier-b2", "ort");

const expectedPackageVersion = "1.27.0";
const files = [
  { name: "ort.wasm.min.js", expectedBytes: 50139 },
  { name: "ort-wasm-simd-threaded.mjs", expectedBytes: 24180 },
  { name: "ort-wasm-simd-threaded.wasm", expectedBytes: 13479978 },
];

const packageMetadata = JSON.parse(await readFile(join(ortDist, "..", "package.json"), "utf8"));
if (packageMetadata.version !== expectedPackageVersion) {
  throw new Error(`onnxruntime-web ${packageMetadata.version} does not match the vendored asset contract ${expectedPackageVersion}; re-check byte sizes and heavy-assets.json before bumping.`);
}

await mkdir(destination, { recursive: true });
for (const file of files) {
  const source = join(ortDist, file.name);
  await copyFile(source, join(destination, file.name));
  const { size } = await stat(join(destination, file.name));
  if (size !== file.expectedBytes) {
    throw new Error(`${file.name} is ${size} bytes after copy; expected ${file.expectedBytes} (heavy-assets.json and triageAssets.ts assume this exact size).`);
  }
}

console.log(`Synced ${files.length} onnxruntime-web browser asset(s) for Triage Router local inference.`);
